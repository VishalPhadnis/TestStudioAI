export function renderDropZone(
  onFileSelected: (file: File | null) => void
): void {
  const container = document.getElementById('drop-zone-container')!;

  container.innerHTML = `
    <div class="drop-zone" id="drop-zone">
      <input type="file" class="drop-zone__input" id="drop-zone-input" accept=".png,.jpg,.jpeg,.webp" />
      <svg class="drop-zone__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <p class="drop-zone__text">Drag & Drop Screenshot of Requirement</p>
      <p class="drop-zone__hint">or click to browse • PNG, JPG, WebP up to 10MB</p>
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
    if (file && file.type.startsWith('image/')) {
      showPreview(file, onFileSelected);
    }
  });
}

function showPreview(file: File, onFileSelected: (file: File | null) => void): void {
  const dropZone = document.getElementById('drop-zone')!;
  const fileSize = formatFileSize(file.size);

  // Create image preview
  const reader = new FileReader();
  reader.onload = (e) => {
    dropZone.classList.add('drop-zone--has-file');
    dropZone.innerHTML = `
      <input type="file" class="drop-zone__input" id="drop-zone-input" accept=".png,.jpg,.jpeg,.webp" />
      <div class="drop-zone__preview">
        <img src="${e.target?.result}" alt="Screenshot preview" class="drop-zone__preview-img" />
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
  reader.readAsDataURL(file);
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
