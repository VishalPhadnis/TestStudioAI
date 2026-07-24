import { Router, Request, Response } from 'express';
import multer from 'multer';
import { generateTestCases } from '../services/groqService.js';

const router = Router();

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPG, and WebP images are allowed'));
    }
  },
});

// POST /api/generate-testcases
router.post('/', upload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const requirementText = req.body.requirementText as string | undefined;
    const additionalNotes = req.body.additionalNotes as string | undefined;

    // Validate: at least one input must be provided
    if (!file && !requirementText?.trim()) {
      res.status(400).json({
        error: 'Please provide a requirement screenshot or text description.',
      });
      return;
    }

    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (file) {
      imageBase64 = file.buffer.toString('base64');
      imageMimeType = file.mimetype;
    }

    const testCases = await generateTestCases(
      imageBase64,
      imageMimeType,
      requirementText?.trim(),
      additionalNotes?.trim()
    );

    res.json({ testCases });
  } catch (error: unknown) {
    console.error('Error generating test cases:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    res.status(500).json({ error: message });
  }
});

export default router;
