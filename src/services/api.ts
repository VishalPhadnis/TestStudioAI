import type { GenerateResponse, SettingsResponse } from '../types/index.js';

const API_BASE = '/api';

export async function loadSettings(): Promise<SettingsResponse> {
  // Check localStorage first for stateless/Vercel support
  const localKey = localStorage.getItem('groq_api_key') || '';
  if (localKey) {
    return {
      groqApiKey: localKey.substring(0, 4) + '••••••••' + localKey.substring(localKey.length - 4),
      hasApiKey: true,
    };
  }

  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) {
    throw new Error('Failed to load settings');
  }
  return res.json();
}

export async function saveSettings(groqApiKey: string): Promise<SettingsResponse> {
  const trimmed = groqApiKey.trim();
  localStorage.setItem('groq_api_key', trimmed);

  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groqApiKey: trimmed }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to save settings');
  }
  return data;
}

export async function generateTestCases(
  file: File | null,
  requirementText: string,
  additionalNotes: string
): Promise<GenerateResponse> {
  const formData = new FormData();

  if (file) {
    formData.append('screenshot', file);
  }

  if (requirementText.trim()) {
    formData.append('requirementText', requirementText.trim());
  }

  if (additionalNotes.trim()) {
    formData.append('additionalNotes', additionalNotes.trim());
  }

  const headers: Record<string, string> = {};
  const localKey = localStorage.getItem('groq_api_key');
  if (localKey) {
    headers['x-groq-api-key'] = localKey;
  }

  const res = await fetch(`${API_BASE}/generate-testcases`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate test cases');
  }

  return data;
}
