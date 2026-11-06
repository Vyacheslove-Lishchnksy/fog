import { t } from './i18n';

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
      <div class="dbg-head"><b id="pointNameTitle">${t('pointModal.title')}</b><button id="btnPointNameClose" class="btn small ghost">✕</button></div>
      <p class="muted" id="pointNameHint">${t('pointModal.hint')}</p>
      <input id="pointNameInput" type="text" placeholder="${t('pointModal.placeholder')}" />
      <div class="row">
        <button id="btnPointNameOk" class="btn primary">${t('pointModal.ok')}</button>
        <button id="btnPointNameCancel" class="btn ghost">${t('pointModal.cancel')}</button>
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

// Модалка створюється один раз — освіжаємо тексти при кожному відкритті,
// щоб перемикання мови працювало без перезавантаження.
function refreshTexts(): void {
  if (!nameModal || !nameInput) return;
  (nameModal.querySelector('#pointNameTitle') as HTMLElement).textContent = t('pointModal.title');
  (nameModal.querySelector('#pointNameHint') as HTMLElement).textContent = t('pointModal.hint');
  nameInput.placeholder = t('pointModal.placeholder');
  (nameModal.querySelector('#btnPointNameOk') as HTMLElement).textContent = t('pointModal.ok');
  (nameModal.querySelector('#btnPointNameCancel') as HTMLElement).textContent = t('pointModal.cancel');
}

function closeNameModal(value: string | null): void {
  if (!nameModal) return;
  nameModal.classList.add('hidden');
  if (nameResolve) { nameResolve(value); nameResolve = null; }
}

export function askPointName(): Promise<string | null> {
  ensureNameModal();
  refreshTexts();
  nameModal!.classList.remove('hidden');
  nameInput!.value = '';
  nameInput!.focus();
  return new Promise((resolve) => { nameResolve = resolve; });
}
