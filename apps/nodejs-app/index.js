const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 80;

// Enable CORS for frontend requests
app.use(cors());

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres-service.apps.svc.cluster.local:5432/postgres'
});

// Helper function to parse Browser and OS from User-Agent string
function parseUserAgent(uaString) {
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';

  if (!uaString) return { os, browser };

  // Detect Operating System
  if (uaString.includes('Windows')) os = 'Windows';
  else if (uaString.includes('Macintosh') || uaString.includes('Mac OS X')) os = 'macOS';
  else if (uaString.includes('Linux')) os = 'Linux';
  else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';
  else if (uaString.includes('Android')) os = 'Android';

  // Detect Browser
  if (uaString.includes('Edg/')) browser = 'Edge';
  else if (uaString.includes('Chrome/') && !uaString.includes('Chromium')) browser = 'Chrome';
  else if (uaString.includes('Firefox/')) browser = 'Firefox';
  else if (uaString.includes('Safari/') && !uaString.includes('Chrome')) browser = 'Safari';

  return { os, browser };
}

// Initialize database schema on startup
async function initDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS page_views (
      id SERIAL PRIMARY KEY,
      ip_address VARCHAR(45),
      browser VARCHAR(50),
      os VARCHAR(50),
      user_agent TEXT,
      visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await pool.query(createTableQuery);
    console.log('Database table "page_views" is ready.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Analytics API endpoint
app.get('/api/visit', async (req, res) => {
  // Extract real visitor IP provided by Cloudflare proxy
  const ipAddress = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Extract User-Agent header
  const userAgent = req.headers['user-agent'] || '';
  
  // Parse OS and Browser details
  const { os, browser } = parseUserAgent(userAgent);

  try {
    // Insert analytics data into PostgreSQL
    const insertQuery = `
      INSERT INTO page_views (ip_address, browser, os, user_agent)
      VALUES ($1, $2, $3, $4);
    `;
    await pool.query(insertQuery, [ipAddress, browser, os, userAgent]);

    // Get total view count
    const countResult = await pool.query('SELECT COUNT(*) FROM page_views;');
    const totalViews = countResult.rows[0].count;

    // Respond with current stats
    res.json({
      status: 'success',
      totalViews: parseInt(totalViews),
      yourIp: ipAddress,
      yourOs: os,
      yourBrowser: browser
    });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ status: 'error', message: 'Database error' });
  }
});

// Start server and run DB init
app.listen(port, () => {
  console.log(`Analytics API listening on port ${port}`);
  initDatabase();
});
