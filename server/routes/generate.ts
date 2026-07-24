import { Router, Request, Response } from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { generateTestCases } from '../services/groqService.js';

const router = Router();

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.pdf') || 
        file.originalname.endsWith('.docx') || 
        file.originalname.endsWith('.doc')) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and Word documents (.doc/.docx) are allowed'));
    }
  },
});

// POST /api/generate-testcases
router.post('/', upload.single('screenshot'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    let requirementText = req.body.requirementText as string | undefined;
    const additionalNotes = req.body.additionalNotes as string | undefined;

    // Validate: at least one input must be provided
    if (!file && !requirementText?.trim()) {
      res.status(400).json({
        error: 'Please provide a requirement screenshot, document, or text description.',
      });
      return;
    }

    let imageBase64: string | undefined;
    let imageMimeType: string | undefined;

    if (file) {
      const isImage = file.mimetype.startsWith('image/');
      
      if (isImage) {
        imageBase64 = file.buffer.toString('base64');
        imageMimeType = file.mimetype;
      } else {
        // Document extraction
        let extractedText = '';
        if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
          try {
            const pdfData = await pdf(file.buffer);
            extractedText = pdfData.text;
          } catch (pdfErr) {
            console.error('PDF extraction error:', pdfErr);
            throw new Error('Failed to parse text from PDF file.');
          }
        } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.originalname.endsWith('.docx')) {
          try {
            const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
            extractedText = docxResult.value;
          } catch (docxErr) {
            console.error('DOCX extraction error:', docxErr);
            throw new Error('Failed to parse text from Word Document (.docx).');
          }
        } else if (file.originalname.endsWith('.doc')) {
          throw new Error('Old Word Document format (.doc) is not supported. Please convert it to .docx or PDF first.');
        } else {
          throw new Error('Unsupported document format uploaded.');
        }

        if (!extractedText.trim()) {
          throw new Error('The uploaded document appears to have no readable text.');
        }

        requirementText = `${requirementText ? requirementText + '\n\n' : ''}--- Requirements from Document (${file.originalname}) ---\n${extractedText}`;
      }
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
