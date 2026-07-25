const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    )
  `);
  tableReady = true;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-App-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const required = process.env.APP_SECRET;
  const provided = req.headers['x-app-secret'];
  if (required && provided !== required) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    await ensureTable();

    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key) return res.status(400).json({ error: 'key required' });
      const result = await client.execute({
        sql: 'SELECT value FROM kv WHERE key = ?',
        args: [key],
      });
      if (result.rows.length === 0) return res.status(200).json({ value: null });
      return res.status(200).json({ value: result.rows[0].value });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { body = {}; }
      }
      const { key, value } = body || {};
      if (!key) return res.status(400).json({ error: 'key required' });
      await client.execute({
        sql: `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        args: [key, value ?? '', new Date().toISOString()],
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
};
