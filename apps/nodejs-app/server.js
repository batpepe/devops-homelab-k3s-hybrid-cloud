const http = require('http');
const { Pool } = require('pg');


const pool = new Pool({
    host: process.env.DB_HOST || 'postgres-service',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'devops',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'homelab_db'
});

pool.query('CREATE TABLE IF NOT EXISTS visits (id SERIAL PRIMARY KEY, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)')
    .then(() => console.log("Connected to PostgreSQL - visits table ready"))
    .catch(err => console.error("Database initialization error:", err.stack));

const server = http.createServer(async (req, res) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET',
    };

    if (req.method === 'OPTIONS') {
        res.writeHead(204, headers);
        return res.end();
    }

    if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }

    try {
        await pool.query('INSERT INTO visits DEFAULT VALUES');
        const result = await pool.query('SELECT COUNT(*) AS total FROM visits');

        res.writeHead(200, headers);
        res.end(JSON.stringify({
            service: "Node.js + PostgreSQL API",
            status: "Healthy",
            total_visits: parseInt(result.rows[0].total),
            developer: "Kostiantyn Osmakov",
            timestamp: new Date().toISOString()
        }));
    } catch (err) {
        res.writeHead(500, headers);
        res.end(JSON.stringify({ error: "Database error", details: err.message }));
    }
});

server.listen(80, () => {
    console.log("Node.js microservice listening on port 80");
});
