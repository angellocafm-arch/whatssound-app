// Regenerate Golden Boosts - Cron Job (Fridays 11:00 UTC)
// Uses fetch directly like other working API files

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SB = 'https://xyehncvvvprrqwnsefcr.supabase.co';
  const SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWhuY3Z2dnBycnF3bnNlZmNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY1MDg5OCwiZXhwIjoyMDg1MjI2ODk4fQ.ANwuQ-wrlyfEKD2f-f5Tr67UpDOAb--wmEWcnzG02Q8';
  
  const headers = {
    'apikey': SRK,
    'Authorization': `Bearer ${SRK}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  try {
    // Reset weekly_boosts_given to 0 for all users
    const response = await fetch(`${SB}/rest/v1/ws_profiles?weekly_boosts_given=gt.0`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ weekly_boosts_given: 0 })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error: 'Failed to reset boosts', details: error });
    }

    const updated = await response.json().catch(() => []);
    
    return res.status(200).json({
      success: true,
      message: 'Golden Boosts regenerated',
      usersReset: updated.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
