// Serverless Deezer proxy for WhatsSound
// Vercel deploys this as /api/deezer

export default async function handler(req, res) {
  const { q, limit = 10, endpoint = 'search' } = req.query;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'public, max-age=300');
  
  if (!q && endpoint === 'search') {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }
  
  try {
    let url;
    if (endpoint === 'search') {
      url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=${limit}`;
    } else if (endpoint === 'track') {
      url = `https://api.deezer.com/track/${q}`;
    } else if (endpoint === 'raw') {
      // Raw proxy mode — forward any Deezer URL
      url = req.query.url;
    } else {
      url = `https://api.deezer.com/${endpoint}?q=${encodeURIComponent(q || '')}&limit=${limit}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Deezer API error', details: err.message });
  }
}
