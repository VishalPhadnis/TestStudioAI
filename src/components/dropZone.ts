export function renderDropZone(
  onFileSelected: (file: File | null) => void
): void {
  const container = document.getElementById('drop-zone-container')!;

  container.innerHTML = `
    <div class="drop-zone" id="drop-zone">
      <input type="file" class="drop-zone__input" id="drop-zone-input" accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx" />
      <svg class="drop-zone__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
      <p class="drop-zone__text">Drag & Drop Screenshot or Document (PDF, Word)</p>
      <p class="drop-zone__hint">or click to browse • PNG, JPG, WebP, PDF, DOC, DOCX up to 10MB</p>
    </div>
  `;

  const dropZone = document.getElementById('drop-zone')!;
  const fileInput = document.getElementById('drop-zone-input') as HTMLInputElement;

  // Click to browse
  dropZone.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.drop-zone__remove')) return;
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0] || null;
    if (file) {
      showPreview(file, onFileSelected);
    }
  });

  // Drag events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drop-zone--active');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drop-zone--active');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drop-zone--active');
    const file = e.dataTransfer?.files[0] || null;
    if (file) {
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.pdf', '.doc', '.docx'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (allowedExtensions.includes(fileExtension) || file.type.startsWith('image/') || file.type === 'application/pdf') {
        showPreview(file, onFileSelected);
      }
    }
  });
}

function showPreview(file: File, onFileSelected: (file: File | null) => void): void {
  const dropZone = document.getElementById('drop-zone')!;
  const fileSize = formatFileSize(file.size);
  const isImage = file.type.startsWith('image/');

  const updateUI = (previewSrc: string) => {
    dropZone.classList.add('drop-zone--has-file');
    const previewEl = isImage 
      ? `<img src="${previewSrc}" alt="Screenshot preview" class="drop-zone__preview-img" />`
      : `<div class="drop-zone__preview-img" style="display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.1);color:var(--color-accent)">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
         </div>`;

    dropZone.innerHTML = `
      <input type="file" class="drop-zone__input" id="drop-zone-input" accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx" />
      <div class="drop-zone__preview">
        ${previewEl}
        <div class="drop-zone__preview-info">
          <p class="drop-zone__preview-name">${file.name}</p>
          <p class="drop-zone__preview-size">${fileSize}</p>
        </div>
        <button class="drop-zone__remove" id="drop-zone-remove" type="button" title="Remove file">×</button>
      </div>
    `;

    // Re-bind remove button
    document.getElementById('drop-zone-remove')!.addEventListener('click', (e) => {
      e.stopPropagation();
      resetDropZone(onFileSelected);
      onFileSelected(null);
    });

    // Re-bind file input
    const newInput = document.getElementById('drop-zone-input') as HTMLInputElement;
    newInput.addEventListener('change', () => {
      const newFile = newInput.files?.[0] || null;
      if (newFile) {
        showPreview(newFile, onFileSelected);
        onFileSelected(newFile);
      }
    });

    onFileSelected(file);
  };

  if (isImage) {
    const reader = new FileReader();
    reader.onload = (e) => {
      updateUI(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  } else {
    updateUI('');
  }
}

function resetDropZone(onFileSelected: (file: File | null) => void): void {
  const container = document.getElementById('drop-zone-container')!;
  renderDropZone(onFileSelected);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
