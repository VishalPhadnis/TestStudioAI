import { saveSettings as saveSettingsApi, loadSettings as loadSettingsApi } from '../services/api.js';

export function renderSettingsModal(
  onClose: () => void,
  onSaved: (hasApiKey: boolean) => void
): void {
  const container = document.getElementById('settings-modal-container')!;

  container.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal" id="settings-modal">
        <div class="modal__header">
          <h2 class="modal__title">Settings</h2>
          <button class="modal__close" id="modal-close" type="button">×</button>
        </div>

        <div class="modal__field">
          <label class="modal__label" for="groq-api-key">Groq API Key</label>
          <div class="modal__input-wrapper">
            <input
              type="password"
              class="modal__input"
              id="groq-api-key"
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
              autocomplete="off"
            />
            <button class="modal__toggle-visibility" id="toggle-key-visibility" type="button" title="Toggle visibility">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <p class="modal__hint">
            Get your free API key from <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com</a>
          </p>
        </div>

        <button class="btn-save" id="btn-save-settings" type="button">Save Settings</button>
      </div>
    </div>
  `;

  const overlay = document.getElementById('modal-overlay')!;
  const closeBtn = document.getElementById('modal-close')!;
  const saveBtn = document.getElementById('btn-save-settings')!;
  const apiKeyInput = document.getElementById('groq-api-key') as HTMLInputElement;
  const toggleBtn = document.getElementById('toggle-key-visibility')!;

  // Load existing settings
  loadSettingsApi().then((settings) => {
    if (settings.hasApiKey) {
      apiKeyInput.placeholder = settings.groqApiKey || 'API key is saved';
    }
  }).catch(() => {
    // Ignore load errors
  });

  // Close modal
  const closeModal = () => {
    container.innerHTML = '';
    onClose();
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Escape key to close
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Toggle password visibility
  let isVisible = false;
  toggleBtn.addEventListener('click', () => {
    isVisible = !isVisible;
    apiKeyInput.type = isVisible ? 'text' : 'password';
    toggleBtn.innerHTML = isVisible
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
           <line x1="1" y1="1" x2="23" y2="23"></line>
         </svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
           <circle cx="12" cy="12" r="3"></circle>
         </svg>`;
  });

  // Save settings
  saveBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showToast('Please enter your Groq API key', 'error');
      return;
    }

    saveBtn.textContent = 'Saving...';
    (saveBtn as HTMLButtonElement).disabled = true;

    try {
      const result = await saveSettingsApi(key);
      showToast('Settings saved successfully!', 'success');
      onSaved(result.hasApiKey);
      setTimeout(closeModal, 800);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      showToast(message, 'error');
    } finally {
      saveBtn.textContent = 'Save Settings';
      (saveBtn as HTMLButtonElement).disabled = false;
    }
  });

  // Focus the input
  setTimeout(() => apiKeyInput.focus(), 100);
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const container = document.getElementById('toast-container')!;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Remove after animation
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3500);
}
