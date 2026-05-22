const http = require('http');
const { Client } = require('pg');

// Configure DB connection via Kubernetes internal DNS
const client = new Client({
    host: 'postgres-service',
    port: 5432,
    user: 'devops',
    password: 'supersecretpassword',
    database: 'homelab_db'
});

// Connect to PostgreSQL and create table if it does not exist
client.connect()
    .then(() => {
        console.log("Connected to PostgreSQL!");
        return client.query('CREATE TABLE IF NOT EXISTS visits (id SERIAL PRIMARY KEY, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
    })
    .catch(err => console.error("Database connection error:", err.stack));

const server = http.createServer(async (req, res) => {
    // CORS Headers - The Magic Fix!
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', /* Allows requests from any frontend */
        'Access-Control-Allow-Methods': 'GET',
    };

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, headers);
        return res.end();
    }

    // Ignore favicon requests
    if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }

    try {
        // Insert a new visit record
        await client.query('INSERT INTO visits DEFAULT VALUES');
        // Fetch the total number of visits
        const result = await client.query('SELECT COUNT(*) AS total FROM visits');

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
