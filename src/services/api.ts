import type { GenerateResponse, SettingsResponse } from '../types/index.js';

const API_BASE = '/api';

export async function loadSettings(): Promise<SettingsResponse> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) {
    throw new Error('Failed to load settings');
  }
  return res.json();
}

export async function saveSettings(groqApiKey: string): Promise<SettingsResponse> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groqApiKey }),
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

  const res = await fetch(`${API_BASE}/generate-testcases`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate test cases');
  }

  return data;
}
