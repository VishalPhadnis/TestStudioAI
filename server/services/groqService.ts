import Groq from 'groq-sdk';
import { loadSettings } from '../utils/settingsManager.js';

export interface TestCase {
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

export async function generateTestCases(
  imageBase64?: string,
  imageMimeType?: string,
  requirementText?: string,
  additionalNotes?: string,
  apiKeyOverride?: string
): Promise<TestCase[]> {
  const settings = loadSettings();
  const apiKey = apiKeyOverride || settings.groqApiKey || process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq API key not configured. Please set it in Settings.');
  }

  const groq = new Groq({ apiKey });

  // Build the user message content
  const userContent: Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  > = [];

  if (imageBase64 && imageMimeType) {
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${imageMimeType};base64,${imageBase64}`,
      },
    });
    userContent.push({
      type: 'text',
      text: 'Analyze the above requirement screenshot and generate test cases.',
    });
  }

  if (requirementText) {
    userContent.push({
      type: 'text',
      text: `Requirement Details:\n${requirementText}`,
    });
  }

  if (additionalNotes) {
    userContent.push({
      type: 'text',
      text: `Additional Notes:\n${additionalNotes}`,
    });
  }

  if (userContent.length === 0) {
    throw new Error('Please provide a requirement screenshot or text description.');
  }

  // Models to try in order — vision-capable models on Groq
  const MODELS = [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'meta-llama/llama-4-scout-17b-16e-instruct:free',
    'llama-4-scout-17b-16e-instruct',
    'meta-llama/llama-3.2-90b-vision-preview',
    'meta-llama/llama-3.2-11b-vision-preview',
  ];

  // For text-only requests, also consider non-vision models as last resort
  const TEXT_ONLY_FALLBACK = 'llama-3.3-70b-versatile';

  try {
    let chatCompletion = null;
    let lastError: Error | null = null;

    const modelsToTry = imageBase64
      ? MODELS
      : [...MODELS, TEXT_ONLY_FALLBACK];

    for (const model of modelsToTry) {
      try {
        console.log(`Trying model: ${model}`);
        chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: userContent,
            },
          ],
          model,
          temperature: 0.3,
          max_completion_tokens: 4096,
        });
        console.log(`✅ Success with model: ${model}`);
        break; // success — stop trying
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message || '';
        // Only retry on model-not-found; throw immediately on other errors
        if (errMsg.includes('model') && (errMsg.includes('not exist') || errMsg.includes('not found') || errMsg.includes('not_found'))) {
          console.warn(`Model ${model} not available, trying next...`);
          continue;
        }
        throw lastError;
      }
    }

    if (!chatCompletion) {
      throw lastError || new Error('No compatible model found on your Groq account. Please check your API key and available models at console.groq.com.');
    }

    const responseText = chatCompletion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response received from Groq AI.');
    }

    // Parse the JSON response — handle potential markdown code fences
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

    return testCases;
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response. Please try again.');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while generating test cases.');
  }
}
