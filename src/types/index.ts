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

export interface GenerateResponse {
  testCases: TestCase[];
}

export interface SettingsResponse {
  groqApiKey: string;
  hasApiKey: boolean;
  message?: string;
}

export interface AppState {
  uploadedFile: File | null;
  requirementText: string;
  additionalNotes: string;
  testCases: TestCase[];
  isLoading: boolean;
  hasApiKey: boolean;
}
