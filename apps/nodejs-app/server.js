const http = require('http');
const { Client } = require('pg');

// Налаштування підключення до БД через внутрішній DNS Kubernetes
const client = new Client({
    host: 'postgres-service',
    port: 5432,
    user: 'devops',
    password: 'supersecretpassword',
    database: 'homelab_db'
});

// Підключаємось до БД і створюємо таблицю, якщо її ще немає
client.connect()
    .then(() => {
        console.log("Connected to PostgreSQL!");
        return client.query('CREATE TABLE IF NOT EXISTS visits (id SERIAL PRIMARY KEY, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    })
    .catch(err => console.error("Database connection error:", err.stack));

const server = http.createServer(async (req, res) => {
    if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }

    try {
        // Додаємо запис про новий візит
        await client.query('INSERT INTO visits DEFAULT VALUES');
        // Отримуємо загальну кількість візитів
        const result = await client.query('SELECT COUNT(*) AS total FROM visits');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            service: "Node.js + PostgreSQL API",
            status: "Healthy",
            total_visits: parseInt(result.rows[0].total),
            developer: "Kostiantyn Osmakov",
            timestamp: new Date().toISOString()
        }));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Database error", details: err.message }));
    }
});

server.listen(80, () => {
    console.log("Node.js microservice listening on port 80");
});
// trigger ci
// trigger rebuild after yaml fix
