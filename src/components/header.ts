export function renderHeader(hasApiKey: boolean, onSettingsClick: () => void): void {
  const header = document.getElementById('app-header')!;

  header.innerHTML = `
    <div class="app-header">
      <div>
        <h1 class="app-header__title">Test Case Generator</h1>
        <p class="app-header__subtitle">AI-Powered QA Test Case Creation</p>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div class="api-status" id="api-status">
          <span class="api-status__dot ${hasApiKey ? 'api-status__dot--active' : ''}" id="api-status-dot"></span>
          <span id="api-status-text">${hasApiKey ? 'API Connected' : 'API Key Required'}</span>
        </div>
        <button class="btn-settings" id="btn-settings" type="button">
          <svg class="btn-settings__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
          </svg>
          Settings
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-settings')!.addEventListener('click', onSettingsClick);
}

export function updateApiStatus(hasApiKey: boolean): void {
  const dot = document.getElementById('api-status-dot');
  const text = document.getElementById('api-status-text');
  if (dot && text) {
    dot.className = `api-status__dot ${hasApiKey ? 'api-status__dot--active' : ''}`;
    text.textContent = hasApiKey ? 'API Connected' : 'API Key Required';
  }
}
