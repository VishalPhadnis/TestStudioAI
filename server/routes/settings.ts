import { Router, Request, Response } from 'express';
import { loadSettings, saveSettings, getMaskedApiKey } from '../utils/settingsManager.js';

const router = Router();

// GET /api/settings — return settings with masked API key
router.get('/', (_req: Request, res: Response) => {
  try {
    const settings = loadSettings();
    res.json({
      groqApiKey: getMaskedApiKey(settings.groqApiKey),
      hasApiKey: !!settings.groqApiKey,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// POST /api/settings — save settings
router.post('/', (req: Request, res: Response) => {
  try {
    const { groqApiKey } = req.body;

    if (!groqApiKey || typeof groqApiKey !== 'string') {
      res.status(400).json({ error: 'Invalid API key provided' });
      return;
    }

    const trimmedKey = groqApiKey.trim();
    if (trimmedKey.length < 10) {
      res.status(400).json({ error: 'API key seems too short. Please check your key.' });
      return;
    }

    saveSettings({ groqApiKey: trimmedKey });
    res.json({
      message: 'Settings saved successfully',
      groqApiKey: getMaskedApiKey(trimmedKey),
      hasApiKey: true,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
