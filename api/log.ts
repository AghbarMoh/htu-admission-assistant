export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security: Only allow requests from your website
  const origin = req.headers.origin || req.headers.referer;
  const allowedDomains = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://htuaibot.xyz',
    'https://www.htuaibot.xyz'
  ];

  if (origin && !allowedDomains.some(domain => origin.startsWith(domain))) {
    return res.status(403).json({ error: 'Forbidden: Invalid Origin' });
  }

  // Your Google URL is now safely hidden on the server
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWM4u6vT03fa6JN6zSIAVxdtGLBw7Dw6-oigPZ3nktc6NLaAPrzeTS5395-mjnogs4kw/exec';

  try {
    // The Vercel server talks to Google, so the browser doesn't have to
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(req.body),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Backend Logging Error:", error);
    return res.status(500).json({ error: 'Failed to log data' });
  }
}