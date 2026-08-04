const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { Pool } = require('pg');

const SERVICE_NAME = 'Node.js + PostgreSQL API';
const VERSION = process.env.GIT_SHA || 'dev';

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres-service',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'devops',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'homelab_db'
});

// Idempotent boot migration: safe to run on every start, PG 15 supports
// IF NOT EXISTS for all three statements. Non-fatal so a slow database
// does not crash-loop the pod; queries fail loudly later if it never ran.
const MIGRATIONS = [
    `CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE visits ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'cv'`,
    `CREATE INDEX IF NOT EXISTS visits_timestamp_idx ON visits (timestamp)`
];

(async () => {
    try {
        for (const sql of MIGRATIONS) await pool.query(sql);
        console.log('Connected to PostgreSQL - visits schema ready');
    } catch (err) {
        console.error('Database initialization error:', err.stack);
    }
})();

// Sibling workloads aggregated by /api/status. In-cluster service DNS; the
// targets are static (nginx) or DB-free (/api/health), so checks have no
// side effects. Overridable for local runs.
const SIBLINGS = {
    cv: process.env.CV_URL || 'http://nginx-svc/',
    museum: process.env.MUSEUM_URL || 'http://batman-museum-svc/api/health',
    game: process.env.GAME_URL || 'http://batman-svc/'
};
const SIBLING_CACHE_MS = 10000;
let siblingCache = { at: 0, data: null };

async function checkSiblings() {
    const now = Date.now();
    if (siblingCache.data && now - siblingCache.at < SIBLING_CACHE_MS) {
        return siblingCache.data;
    }
    const names = Object.keys(SIBLINGS);
    const results = await Promise.allSettled(
        names.map((name) =>
            fetch(SIBLINGS[name], { signal: AbortSignal.timeout(1500) })
        )
    );
    const services = {};
    names.forEach((name, i) => {
        const r = results[i];
        services[name] = { ok: r.status === 'fulfilled' && r.value.ok };
    });
    siblingCache = { at: now, data: services };
    return services;
}

const app = express();
app.disable('x-powered-by');
// Traefik routes cv.batpepe.online/api to this service, so the CV frontend
// calls /api/* on its own host and never needs CORS at all. The allowlist only
// governs genuine cross-origin callers, where '*' let any site on the internet
// read the API. Comma-separated ALLOWED_ORIGIN overrides it for local runs.
const ALLOWED_ORIGINS = (
    process.env.ALLOWED_ORIGIN ||
    'https://cv.batpepe.online,https://museum.batpepe.online,https://game.batpepe.online'
)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
app.use(cors({ origin: ALLOWED_ORIGINS, methods: ['GET'] }));

// Every /api route touches Postgres, and /api/visit writes a row per call, so
// an unthrottled client can inflate the counter and grow the table for free.
// Public traffic arrives through the Cloudflare tunnel, which means the socket
// address is always the in-cluster ingress; CF-Connecting-IP is set by the
// edge and cannot be spoofed by the client. Fall back to the socket address
// for in-cluster callers (probes, /api/status siblings), which are not public.
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.headers['cf-connecting-ip'] || req.ip
});
app.use('/api', apiLimiter);

// Probe target: no database access, so liveness/readiness ticks stop
// inflating the visit counter (the old catch-all server inserted a row
// on every probe).
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Kept 200 and insert-free so an old probe config pointing at / stays green
// while the image and the manifest roll out independently.
app.get('/', (req, res) => {
    res.json({
        service: SERVICE_NAME,
        status: 'ok',
        version: VERSION,
        endpoints: ['/health', '/api/visit', '/api/stats', '/api/status']
    });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Legacy contract: the deployed CV frontend checks status === "Healthy" and
// reads total_visits. Field set must not change until the new frontend ships.
app.get('/api/visit', async (req, res) => {
    try {
        await pool.query(`INSERT INTO visits (source) VALUES ('cv')`);
        const result = await pool.query('SELECT COUNT(*) AS total FROM visits');
        res.json({
            service: SERVICE_NAME,
            status: 'Healthy',
            total_visits: parseInt(result.rows[0].total),
            developer: 'Kostiantyn Osmakov',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const days = await pool.query(`
            SELECT to_char(d.day, 'YYYY-MM-DD') AS date, COALESCE(v.c, 0)::int AS count
            FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') AS d(day)
            LEFT JOIN (
                SELECT date_trunc('day', timestamp) AS day, COUNT(*) AS c
                FROM visits
                WHERE timestamp >= CURRENT_DATE - INTERVAL '29 days'
                GROUP BY 1
            ) v ON v.day = d.day
            ORDER BY d.day
        `);
        const total = await pool.query('SELECT COUNT(*) AS total FROM visits');
        res.json({
            status: 'ok',
            total: parseInt(total.rows[0].total),
            days: days.rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// Informational, not a probe: always 200, degraded state is data.
app.get('/api/status', async (req, res) => {
    let db = { ok: false, latency_ms: null };
    try {
        const t0 = Date.now();
        await pool.query('SELECT 1');
        db = { ok: true, latency_ms: Date.now() - t0 };
    } catch (err) {
        console.error('Status DB ping failed:', err.message);
    }
    const services = await checkSiblings();
    res.json({
        status: db.ok ? 'ok' : 'degraded',
        version: VERSION,
        uptime_s: Math.floor(process.uptime()),
        db,
        services,
        timestamp: new Date().toISOString()
    });
});

// Every path this service serves, with the methods it supports. Only the
// non-2xx paths consult it, so it costs nothing on a normal request.
const ROUTES = {
    '/': ['GET'],
    '/health': ['GET'],
    '/favicon.ico': ['GET'],
    '/api/visit': ['GET'],
    '/api/stats': ['GET'],
    '/api/status': ['GET']
};

// A known path reached with an unsupported method is 405, not 404. Without
// this, Express falls through to the catch-all below and answers 404, which
// asserts something false: that there is no resource at this URI. RFC 9110
// 15.5.6 also requires the Allow header, so a client learns what it should
// have sent instead of re-checking the URL it already had right (BUG-004).
//
// OPTIONS never reaches here. The cors() middleware above is mounted globally
// and answers every OPTIONS request with 204 and Access-Control-Allow-Methods,
// not only genuine preflights. Reordering to add Allow to that response would
// risk working CORS for a cosmetic gain, so OPTIONS is left to cors().
app.use((req, res, next) => {
    const allowed = ROUTES[req.path];
    if (!allowed) return next();

    res.set('Allow', [...allowed, 'HEAD', 'OPTIONS'].join(', '));
    return res.status(405).json({ error: 'Method not allowed' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

const server = app.listen(80, () => {
    console.log(`Node.js API v2 (${VERSION}) listening on port 80`);
});

process.on('SIGTERM', () => {
    server.close(() => {
        pool.end().finally(() => process.exit(0));
    });
});
