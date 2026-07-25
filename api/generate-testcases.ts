import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { IncomingForm, type Fields, type Files } from 'formidable';
import fs from 'fs';

// Disable Next.js/Vercel body parser so we can handle multipart form data
export const config = {
  api: {
    bodyParser: false,
  },
};

interface TestCase {
  testCaseId: string;
  testType: string;
  module: string;
  testCaseTitle: string;
  description: string;
  preConditions: string;
  testSteps: string;
  testData: string;
  expectedResult: string;
  priority: string;
}

const SYSTEM_PROMPT = `You are a Senior QA Lead with deep expertise in manual and automation testing (Selenium, Playwright). Your task is to analyze the provided requirement (either from a screenshot or text description) and generate exactly 10 comprehensive test cases.

You MUST generate exactly one test case for each of these 10 test types:
1. Positive Testing
2. Negative Testing
3. UI Testing
4. Security Testing
5. Boundary Testing
6. Performance Testing
7. Usability Testing
8. Compatibility Testing
9. Error Handling Testing
10. Integration Testing

Each test case must follow this exact JSON structure:
{
  "testCaseId": "TC_001",
  "testType": "Positive",
  "module": "<Feature/Module name>",
  "testCaseTitle": "<Short descriptive title>",
  "description": "<Detailed description of what is being tested>",
  "preConditions": "<What must be true before running this test>",
  "testSteps": "<Step 1. ... Step 2. ... Step 3. ...>",
  "testData": "<Sample data to use during testing>",
  "expectedResult": "<What should happen when test passes>",
  "priority": "<High|Medium|Low>"
}

IMPORTANT RULES:
- Return ONLY a valid JSON array of exactly 10 test case objects.
- Do NOT include any markdown formatting, code fences, or explanatory text.
- Each test case must be thorough, specific, and actionable.
- Test steps should be numbered and clear.
- Use realistic test data examples.
- Prioritize based on risk and impact (most critical = High).
- The module name should be derived from the requirement being analyzed.`;

// Vision-capable models in order of preference
const MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct:free',
  'llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-3.2-90b-vision-preview',
  'meta-llama/llama-3.2-11b-vision-preview',
];
const TEXT_ONLY_FALLBACK = 'llama-3.3-70b-versatile';

function parseMultipart(req: VercelRequest): Promise<{ fields: Fields; files: Files }> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });
    form.parse(req as any, (err: Error | null, fields: Fields, files: Files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseMultipart(req);

    const groqApiKeyField = Array.isArray(fields.groqApiKey)
      ? fields.groqApiKey[0]
      : fields.groqApiKey;

    const apiKey = groqApiKeyField || (req.headers['x-groq-api-key'] as string) || process.env.GROQ_API_KEY || '';
    if (!apiKey) {
      return res.status(400).json({
        error: 'Groq API key not configured. Please set GROQ_API_KEY in Vercel Environment Variables or use Settings.',
      });
    }

    const screenshotFile = Array.isArray(files.screenshot)
      ? files.screenshot[0]
      : files.screenshot;

    const requirementText = Array.isArray(fields.requirementText)
      ? fields.requirementText[0]
      : fields.requirementText;
    const additionalNotes = Array.isArray(fields.additionalNotes)
      ? fields.additionalNotes[0]
      : fields.additionalNotes;

    if (!screenshotFile && !requirementText?.trim()) {
      return res.status(400).json({
        error: 'Please provide a requirement screenshot or text description.',
      });
    }

    // Build message content
    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [];

    let hasImage = false;

    if (screenshotFile && screenshotFile.filepath) {
      const mimeType = screenshotFile.mimetype || '';
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json({
          error: 'Only PNG, JPG, and WebP images are allowed',
        });
      }

      const fileBuffer = fs.readFileSync(screenshotFile.filepath);
      const base64 = fileBuffer.toString('base64');

      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64}` },
      });
      userContent.push({
        type: 'text',
        text: 'Analyze the above requirement screenshot and generate test cases.',
      });
      hasImage = true;
    }

    if (requirementText?.trim()) {
      userContent.push({
        type: 'text',
        text: `Requirement Details:\n${requirementText.trim()}`,
      });
    }

    if (additionalNotes?.trim()) {
      userContent.push({
        type: 'text',
        text: `Additional Notes:\n${additionalNotes.trim()}`,
      });
    }

    // Call Groq with model fallback
    const groq = new Groq({ apiKey });
    let chatCompletion = null;
    let lastError: Error | null = null;

    const modelsToTry = hasImage ? MODELS : [...MODELS, TEXT_ONLY_FALLBACK];

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        chatCompletion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userContent },
          ],
          model,
          temperature: 0.3,
          max_tokens: 4096,
        });
        console.log(`✅ Success with model: ${model}`);
        break;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message || '';
        if (
          errMsg.includes('model') &&
          (errMsg.includes('not exist') || errMsg.includes('not found') || errMsg.includes('not_found'))
        ) {
          console.warn(`Model ${model} not available, trying next...`);
          continue;
        }
        throw lastError;
      }
    }

    if (!chatCompletion) {
      throw lastError || new Error('No compatible model found. Check your Groq API key.');
    }

    const responseText = chatCompletion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response received from Groq AI.');
    }

    // Parse JSON response
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '');
    }

    const testCases: TestCase[] = JSON.parse(cleanedResponse);

    if (!Array.isArray(testCases) || testCases.length === 0) {
      throw new Error('Invalid response format from AI model.');
    }

    return res.status(200).json({ testCases });
  } catch (error: unknown) {
    console.error('Error generating test cases:', error);
    if (error instanceof SyntaxError) {
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return res.status(500).json({ error: message });
  }
}
