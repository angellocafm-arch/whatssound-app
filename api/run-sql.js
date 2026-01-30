// Run SQL via Supabase Management API from Vercel (can reach supabase.com)
// This uses the undocumented /sql endpoint or pg-meta

module.exports = async (req, res) => {
  if (req.method !== 'POST' || req.query.key !== 'ws2026setup') {
    return res.status(403).json({ error: 'forbidden' });
  }
  const sql = req.body?.sql;
  if (!sql) return res.status(400).json({ error: 'no sql' });

  // Try connecting via pg (installed in project)
  try {
    const { Client } = require('pg');
    const c = new Client({
      host: 'db.xyehncvvvprrqwnsefcr.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'Vertex2026WS!',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    await c.connect();
    const r = await c.query(sql);
    await c.end();
    return res.json({ ok: true, rows: r.rows || [], rowCount: r.rowCount, method: 'pg-direct' });
  } catch (e1) {
    // Try pooler
    try {
      const { Client } = require('pg');
      const c = new Client({
        connectionString: 'postgresql://postgres.xyehncvvvprrqwnsefcr:Vertex2026WS!@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      await c.connect();
      const r = await c.query(sql);
      await c.end();
      return res.json({ ok: true, rows: r.rows || [], rowCount: r.rowCount, method: 'pg-pooler' });
    } catch (e2) {
      return res.status(500).json({ error1: e1.message, error2: e2.message });
    }
  }
};
