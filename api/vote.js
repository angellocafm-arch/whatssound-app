// Vote API: insert vote + update queue count
// Uses service role to bypass RLS for the queue update

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const body = req.body || {};
  const queue_id = body.queue_id || body.queueId;
  const user_id = body.user_id || body.userId;
  if (!queue_id) return res.status(400).json({ error: 'queue_id/queueId required' });

  const SB = 'https://xyehncvvvprrqwnsefcr.supabase.co';
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY1MDg5OCwiZXhwIjoyMDg1MjI2ODk4fQ.ANwuQ-wrlyfEKD2f-f5Tr67UpDOAb--wmEWcnzG02Q8';
  const headers = {
    'apikey': SRK,
    'Authorization': `Bearer ${SRK}`,
    'Content-Type': 'application/json',
  };

  try {
    if (user_id) {
      // Check if already voted
      const checkRes = await fetch(`${SB}/rest/v1/votes?queue_id=eq.${queue_id}&user_id=eq.${user_id}&select=user_id&limit=1`, { headers });
      const existing = await checkRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return res.json({ ok: false, error: 'already_voted' });
      }

      // Insert vote
      const voteRes = await fetch(`${SB}/rest/v1/votes`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ queue_id, user_id }),
      });
      if (!voteRes.ok) {
        return res.status(500).json({ error: 'vote_insert_failed', detail: await voteRes.text() });
      }
    }

    // Count all votes for this queue item
    const countRes = await fetch(`${SB}/rest/v1/votes?queue_id=eq.${queue_id}&select=user_id`, { headers });
    const allVotes = await countRes.json();
    const count = Array.isArray(allVotes) ? allVotes.length : 0;

    // Update queue.votes
    await fetch(`${SB}/rest/v1/queue?id=eq.${queue_id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ votes: count }),
    });

    res.json({ ok: true, votes: count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
