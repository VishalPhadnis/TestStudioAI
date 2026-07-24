import type { TestCase } from '../types/index.js';

export function renderResults(testCases: TestCase[]): void {
  const container = document.getElementById('results-container')!;

  if (testCases.length === 0) {
    container.innerHTML = '';
    return;
  }

  const cardsHtml = testCases.map((tc, index) => {
    const priorityClass = getPriorityClass(tc.priority);
    return `
      <div class="test-case-card" data-index="${index}">
        <div class="test-case-card__header" id="tc-header-${index}">
          <span class="test-case-card__id">${escapeHtml(tc.testCaseId)}</span>
          <span class="test-case-card__title">${escapeHtml(tc.testCaseTitle)}</span>
          <div class="test-case-card__badges">
            <span class="badge badge--type">${escapeHtml(tc.testType)}</span>
            <span class="badge ${priorityClass}">${escapeHtml(tc.priority)}</span>
          </div>
          <svg class="test-case-card__expand" id="tc-expand-${index}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="test-case-card__body" id="tc-body-${index}">
          <div class="test-case-card__detail">
            <span class="test-case-card__detail-label">Module</span>
            <span class="test-case-card__detail-value">${escapeHtml(tc.module)}</span>
          </div>
          <div class="test-case-card__detail">
            <span class="test-case-card__detail-label">Description</span>
            <span class="test-case-card__detail-value">${escapeHtml(tc.description)}</span>
          </div>
          <div class="test-case-card__detail">
            <span class="test-case-card__detail-label">Pre-conditions</span>
            <span class="test-case-card__detail-value">${escapeHtml(tc.preConditions)}</span>
          </div>
          <div class="test-case-card__detail">
            <span class="test-case-card__detail-label">Test Steps</span>
            <span class="test-case-card__detail-value">${escapeHtml(tc.testSteps)}</span>
          </div>
          <div class="test-case-card__detail">
            <span class="test-case-card__detail-label">Test Data</span>
            <span class="test-case-card__detail-value">${escapeHtml(tc.testData)}</span>
          </div>
          <div class="test-case-card__detail">
            <span class="test-case-card__detail-label">Expected Result</span>
            <span class="test-case-card__detail-value">${escapeHtml(tc.expectedResult)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="results-section">
      <div class="results-header">
        <h2 class="results-header__title">
          Generated Test Cases
          <span class="results-header__count">(${testCases.length} cases)</span>
        </h2>
        <button class="btn-download" id="btn-download-csv" type="button">
          <svg class="btn-download__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download CSV
        </button>
      </div>
      <div class="test-case-list">
        ${cardsHtml}
      </div>
    </div>
  `;

  // Bind expand/collapse
  testCases.forEach((_, index) => {
    document.getElementById(`tc-header-${index}`)!.addEventListener('click', () => {
      toggleCard(index);
    });
  });

  // Bind CSV download
  document.getElementById('btn-download-csv')!.addEventListener('click', () => {
    downloadCsv(testCases);
  });

  // Auto-expand first card
  toggleCard(0);

  // Scroll to results
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function toggleCard(index: number): void {
  const body = document.getElementById(`tc-body-${index}`);
  const expand = document.getElementById(`tc-expand-${index}`);
  if (body && expand) {
    body.classList.toggle('test-case-card__body--open');
    expand.classList.toggle('test-case-card__expand--open');
  }
}

function getPriorityClass(priority: string): string {
  const p = priority.toLowerCase();
  if (p === 'high') return 'badge--priority-high';
  if (p === 'medium') return 'badge--priority-medium';
  return 'badge--priority-low';
}

function downloadCsv(testCases: TestCase[]): void {
  const headers = [
    'Test Case ID',
    'Test Type',
    'Module',
    'Test Case Title',
    'Description',
    'Pre-conditions',
    'Test Steps',
    'Test Data',
    'Expected Result',
    'Priority',
  ];

  const rows = testCases.map((tc) => [
    tc.testCaseId,
    tc.testType,
    tc.module,
    tc.testCaseTitle,
    tc.description,
    tc.preConditions,
    tc.testSteps,
    tc.testData,
    tc.expectedResult,
    tc.priority,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `test_cases_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}
