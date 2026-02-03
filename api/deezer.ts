import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { q, type = 'track', id } = req.query;

  if (!q && !id) {
    return res.status(400).json({ error: 'Parámetro q (búsqueda) o id requerido' });
  }

  try {
    let deezerUrl: string;

    if (id) {
      // Obtener track específico por ID
      deezerUrl = `https://api.deezer.com/track/${id}`;
    } else {
      // Búsqueda
      const searchTerm = encodeURIComponent(q as string);
      
      switch (type) {
        case 'track':
          deezerUrl = `https://api.deezer.com/search/track?q=${searchTerm}`;
          break;
        case 'artist':
          deezerUrl = `https://api.deezer.com/search/artist?q=${searchTerm}`;
          break;
        case 'album':
          deezerUrl = `https://api.deezer.com/search/album?q=${searchTerm}`;
          break;
        default:
          deezerUrl = `https://api.deezer.com/search?q=${searchTerm}`;
      }
    }

    console.log('Deezer API URL:', deezerUrl);

    const response = await fetch(deezerUrl, {
      headers: {
        'User-Agent': 'WhatsSound/1.0'
      }
    });

    if (!response.ok) {
      console.error('Deezer API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Error de la API de Deezer',
        details: response.statusText
      });
    }

    const data = await response.json();

    // Cache por 1 hora
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return res.status(200).json(data);

  } catch (error) {
    console.error('Proxy Deezer error:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}