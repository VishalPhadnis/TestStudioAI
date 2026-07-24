import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = path.join(__dirname, '..', '..', 'settings.json');

export interface AppSettings {
  groqApiKey: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  groqApiKey: '',
};

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const updated = { ...current, ...settings };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
  return updated;
}

export function getMaskedApiKey(key: string): string {
  if (!key || key.length < 8) return key ? '••••••••' : '';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
}
