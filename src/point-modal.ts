let nameModal: HTMLElement | null = null;
let nameInput: HTMLInputElement | null = null;
let nameResolve: ((value: string | null) => void) | null = null;

function ensureNameModal(): void {
  if (nameModal) return;
  nameModal = document.createElement('div');
  nameModal.id = 'pointNameModal';
  nameModal.className = 'modal';
  nameModal.innerHTML = `
    <div class="modal-card">
      <div class="dbg-head"><b>📌 Нова точка</b><button id="btnPointNameClose" class="btn small ghost">✕</button></div>
      <p class="muted">Назва точки (можна залишити порожнім):</p>
      <input id="pointNameInput" type="text" placeholder="наприклад: Дім, Парк, Робота" />
      <div class="row">
        <button id="btnPointNameOk" class="btn primary">ОК</button>
        <button id="btnPointNameCancel" class="btn ghost">Скасувати</button>
      </div>
    </div>`;
  document.body.appendChild(nameModal);
  nameInput = nameModal.querySelector('#pointNameInput') as HTMLInputElement;
  nameModal.querySelector('#btnPointNameClose')?.addEventListener('click', () => closeNameModal(null));
  nameModal.querySelector('#btnPointNameCancel')?.addEventListener('click', () => closeNameModal(null));
  nameModal.querySelector('#btnPointNameOk')?.addEventListener('click', () => closeNameModal(nameInput?.value ?? null));
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); closeNameModal(nameInput?.value ?? null); }
    if (e.key === 'Escape') { closeNameModal(null); }
  });
  nameModal.addEventListener('click', (e) => { if (e.target === nameModal) closeNameModal(null); });
}

function closeNameModal(value: string | null): void {
  if (!nameModal) return;
  nameModal.classList.add('hidden');
  if (nameResolve) { nameResolve(value); nameResolve = null; }
}

export function askPointName(): Promise<string | null> {
  ensureNameModal();
  nameModal!.classList.remove('hidden');
  nameInput!.value = '';
  nameInput!.focus();
  return new Promise((resolve) => { nameResolve = resolve; });
}
