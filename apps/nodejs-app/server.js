const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        service: "Node.js Custom Microservice",
        status: "Healthy",
        developer: "Kostiantyn Osmakov",
        timestamp: new Date().toISOString()
    }));
});

server.listen(80, () => {
    console.log("Node.js microservice listening on port 80");
});
