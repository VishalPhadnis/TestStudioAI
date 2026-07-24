import type { VercelRequest, VercelResponse } from '@vercel/node';

// On Vercel, we use environment variables instead of a settings.json file.
// Set GROQ_API_KEY in your Vercel project's Environment Variables settings.

function getMaskedApiKey(key: string): string {
  if (!key || key.length < 8) return key ? '••••••••' : '';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const apiKey = process.env.GROQ_API_KEY || '';
    return res.status(200).json({
      groqApiKey: getMaskedApiKey(apiKey),
      hasApiKey: !!apiKey,
    });
  }

  if (req.method === 'POST') {
    // On Vercel, the API key is managed via environment variables.
    // We'll accept it in the request but warn the user it won't persist across deploys.
    const { groqApiKey } = req.body || {};

    if (!groqApiKey || typeof groqApiKey !== 'string') {
      return res.status(400).json({ error: 'Invalid API key provided' });
    }

    const trimmedKey = groqApiKey.trim();
    if (trimmedKey.length < 10) {
      return res.status(400).json({ error: 'API key seems too short. Please check your key.' });
    }

    // Store in process.env for the current function lifetime
    // For persistent storage on Vercel, use Environment Variables in the dashboard
    process.env.GROQ_API_KEY = trimmedKey;

    return res.status(200).json({
      message: 'Settings saved for this session. For persistence, set GROQ_API_KEY in Vercel Environment Variables.',
      groqApiKey: getMaskedApiKey(trimmedKey),
      hasApiKey: true,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
