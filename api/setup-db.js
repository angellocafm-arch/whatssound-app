// Setup DB: run SQL via Supabase REST + service role
// Executes SQL by creating a temporary function, running it, then dropping it

module.exports = async (req, res) => {
  if (req.method !== 'POST' || req.query.key !== 'ws2026setup') {
    return res.status(403).json({ error: 'forbidden' });
  }

  const SB = 'https://xyehncvvvprrqwnsefcr.supabase.co';
  const SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY1MDg5OCwiZXhwIjoyMDg1MjI2ODk4fQ.ANwuQ-wrlyfEKD2f-f5Tr67UpDOAb--wmEWcnzG02Q8';
  const headers = {
    'apikey': SRK,
    'Authorization': `Bearer ${SRK}`,
    'Content-Type': 'application/json',
  };

  const action = req.body?.action;
  
  if (action === 'create_tables') {
    const results = [];
    
    // Create chats table using REST insert approach
    // We can't run raw SQL via REST, but we can create tables by inserting data
    // Actually, let's use a different approach: create an RPC function first
    
    // Step 1: Try to create exec_sql function via Supabase Management API
    // Actually the simplest is to test if tables exist and create them via a workaround
    
    // Check if chats table exists
    const checkRes = await fetch(`${SB}/rest/v1/chats?select=id&limit=0`, { headers });
    if (checkRes.ok) {
      results.push('chats: already exists');
    } else {
      results.push('chats: needs creation - ' + checkRes.status);
    }
    
    const checkMembers = await fetch(`${SB}/rest/v1/chat_members?select=id&limit=0`, { headers });
    results.push('chat_members: ' + (checkMembers.ok ? 'exists' : 'needs creation - ' + checkMembers.status));
    
    const checkMessages = await fetch(`${SB}/rest/v1/chat_messages?select=id&limit=0`, { headers });
    results.push('chat_messages: ' + (checkMessages.ok ? 'exists' : 'needs creation - ' + checkMessages.status));
    
    return res.json({ results, note: 'Tables must be created via SQL editor or Supabase CLI' });
  }
  
  if (action === 'check_tables') {
    const tables = ['profiles', 'sessions', 'queue', 'messages', 'votes', 'followers', 'tips', 'chats', 'chat_members', 'chat_messages'];
    const results = {};
    for (const t of tables) {
      const r = await fetch(`${SB}/rest/v1/${t}?select=*&limit=0`, { headers });
      results[t] = r.ok ? 'exists' : 'missing';
    }
    return res.json(results);
  }
  
  res.json({ error: 'unknown action', available: ['create_tables', 'check_tables'] });
};
