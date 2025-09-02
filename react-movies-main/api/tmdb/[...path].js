export default async function handler(req, res) {
  try {
    const bearer = process.env.TMDB_BEARER;
    if (!bearer) {
      return res.status(500).json({ error: 'TMDB_BEARER is not configured on the server' });
    }

    const segments = req.query.path || [];
    const pathStr = Array.isArray(segments) ? segments.join('/') : String(segments);

    const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const targetUrl = `https://api.themoviedb.org/3/${pathStr}${queryString}`;

    const tmdbRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${bearer}`,
      },
      // Only forward a body for methods that can have one
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body || {}) : undefined,
    });

    const contentType = tmdbRes.headers.get('content-type') || 'application/json';
    const text = await tmdbRes.text();
    res.status(tmdbRes.status).setHeader('content-type', contentType).send(text);
  } catch (error) {
    console.error('TMDB proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy TMDB request' });
  }
}


