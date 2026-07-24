import './styles/index.css';
import type { AppState } from './types/index.js';
import { renderHeader, updateApiStatus } from './components/header.js';
import { renderDropZone } from './components/dropZone.js';
import { renderRequirementInput } from './components/requirementInput.js';
import { renderSettingsModal, showToast } from './components/settingsModal.js';
import { renderResults } from './components/resultsTable.js';
import { generateTestCases, loadSettings } from './services/api.js';

// ---- Application State ----
const state: AppState = {
  uploadedFile: null,
  requirementText: '',
  additionalNotes: '',
  testCases: [],
  isLoading: false,
  hasApiKey: false,
};

// ---- Initialize App ----
async function init(): Promise<void> {
  // Check if API key exists
  try {
    const settings = await loadSettings();
    state.hasApiKey = settings.hasApiKey;
  } catch {
    state.hasApiKey = false;
  }

  renderHeader(state.hasApiKey, openSettings);
  renderMainContent();
}

// ---- Render Main Content ----
function renderMainContent(): void {
  const main = document.getElementById('app-main')!;

  main.innerHTML = `
    <div class="main-card">
      <p class="main-card__section-label">Upload Requirement</p>
      <div id="drop-zone-container"></div>
      <div id="requirement-input-container"></div>
      <button class="btn-generate" id="btn-generate" type="button">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        Analyze and Create Test Cases
      </button>
    </div>
    <div id="results-container"></div>
  `;

  renderDropZone((file) => {
    state.uploadedFile = file;
  });

  renderRequirementInput(
    (text) => { state.requirementText = text; },
    (notes) => { state.additionalNotes = notes; }
  );

  document.getElementById('btn-generate')!.addEventListener('click', handleGenerate);
}

// ---- Generate Test Cases ----
async function handleGenerate(): Promise<void> {
  // Validate input
  if (!state.uploadedFile && !state.requirementText.trim()) {
    showToast('Please provide a requirement screenshot or text description.', 'error');
    return;
  }

  if (!state.hasApiKey) {
    showToast('Please configure your Groq API key in Settings first.', 'error');
    openSettings();
    return;
  }

  // Show loading state
  state.isLoading = true;
  const btn = document.getElementById('btn-generate') as HTMLButtonElement;
  const originalContent = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `
    <div class="btn-generate__spinner"></div>
    Analyzing requirements...
  `;

  // Show loading overlay
  showLoadingOverlay();

  try {
    const response = await generateTestCases(
      state.uploadedFile,
      state.requirementText,
      state.additionalNotes
    );

    state.testCases = response.testCases;
    renderResults(state.testCases);
    showToast(`${state.testCases.length} test cases generated successfully!`, 'success');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate test cases';
    showToast(message, 'error');
  } finally {
    state.isLoading = false;
    btn.disabled = false;
    btn.innerHTML = originalContent;
    hideLoadingOverlay();
  }
}

// ---- Settings ----
function openSettings(): void {
  renderSettingsModal(
    () => { /* onClose — nothing extra needed */ },
    (hasApiKey) => {
      state.hasApiKey = hasApiKey;
      updateApiStatus(hasApiKey);
    }
  );
}

// ---- Loading Overlay ----
function showLoadingOverlay(): void {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.id = 'loading-overlay';
  overlay.innerHTML = `
    <div class="loading-overlay__spinner"></div>
    <p class="loading-overlay__text">Generating Test Cases...</p>
    <p class="loading-overlay__subtext">Analyzing requirements with Llama Scout AI</p>
  `;
  document.body.appendChild(overlay);
}

function hideLoadingOverlay(): void {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// ---- Start the app ----
init();
