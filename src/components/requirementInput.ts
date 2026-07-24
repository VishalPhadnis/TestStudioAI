export function renderRequirementInput(
  onTextChange: (text: string) => void,
  onNotesChange: (notes: string) => void
): void {
  const container = document.getElementById('requirement-input-container')!;

  container.innerHTML = `
    <div class="input-divider">OR</div>

    <div class="input-group">
      <label class="input-group__label" for="requirement-text">Requirement Details</label>
      <textarea
        class="input-group__textarea"
        id="requirement-text"
        placeholder="Paste your requirement details here...&#10;&#10;Example: The login page should allow users to authenticate using email and password. It should support 'Remember Me' functionality and display appropriate error messages for invalid credentials."
        rows="5"
      ></textarea>
    </div>

    <div class="input-group">
      <label class="input-group__label" for="additional-notes">Additional Notes</label>
      <textarea
        class="input-group__textarea input-group__textarea--notes"
        id="additional-notes"
        placeholder="Any additional context, constraints, or focus areas for test case generation..."
        rows="3"
      ></textarea>
    </div>
  `;

  const textArea = document.getElementById('requirement-text') as HTMLTextAreaElement;
  const notesArea = document.getElementById('additional-notes') as HTMLTextAreaElement;

  textArea.addEventListener('input', () => onTextChange(textArea.value));
  notesArea.addEventListener('input', () => onNotesChange(notesArea.value));
}
