// ==========================================
// INITIAL DATA FROM THE HANDWRITTEN NOTEBOOK
// ==========================================
const DEFAULT_DEBTS = [
  { id: 'd1', name: 'Cristian', amounts: [5000], date: '2026-11-09', notes: '' },
  { id: 'd2', name: 'Corona', amounts: [7000], date: '2026-11-09', notes: '' },
  { id: 'd3', name: 'Enrrique', amounts: [20000, 15000], date: '2026-11-09', notes: 'Cuaderno: 20.000 + 15.000' },
  { id: 'd4', name: 'Hija del Donal', amounts: [37000], date: '2026-11-09', notes: '' },
  { id: 'd5', name: 'Patricia', amounts: [5000, 8000], date: '2026-11-09', notes: 'Cuaderno: 5.000 + 8.000' },
  { id: 'd6', name: 'Miamigo', amounts: [30000], date: '2026-11-09', notes: '' },
  { id: 'd7', name: 'Chilo', amounts: [5000, 10000], date: '2026-11-09', notes: 'Cuaderno: 5.000 + 10.000' },
  { id: 'd8', name: 'Rovison', amounts: [50000], date: '2026-11-09', notes: '' },
  { id: 'd9', name: 'Mario', amounts: [37000, 12000, 10000], date: '2026-11-09', notes: 'Cuaderno: 37.000 + 12.000 + 10.000' },
  { id: 'd10', name: 'Caterine', amounts: [20000, 20000], date: '2026-11-09', notes: 'Cuaderno: 20.000 + 20.000' },
  { id: 'd11', name: 'Rafael', amounts: [7000, 11000], date: '2026-11-09', notes: 'Cuaderno: 7.000 + 11.000' },
  { id: 'd12', name: 'Ricardito', amounts: [10000], date: '2026-11-09', notes: '' },
  { id: 'd13', name: 'Yarlidis', amounts: [8000], date: '2026-11-09', notes: '' },
  { id: 'd14', name: 'Edinson', amounts: [12000], date: '2026-11-09', notes: '' },
  { id: 'd15', name: 'Jelis', amounts: [15000], date: '2026-11-09', notes: '' },
  { id: 'd16', name: 'Jose Falon', amounts: [66000], date: '2026-11-09', notes: '' },
  { id: 'd17', name: 'Cotito', amounts: [9000], date: '2026-11-09', notes: '' },
  { id: 'd18', name: 'Chubi', amounts: [10000], date: '2026-11-09', notes: '' },
  { id: 'd19', name: 'Buni', amounts: [5000], date: '2026-11-09', notes: '' },
  { id: 'd20', name: 'Yesid profe', amounts: [16000], date: '2026-11-09', notes: '' },
  { id: 'd21', name: 'Esequiel emiro', amounts: [30000], date: '2026-11-09', notes: '' },
];

const DEFAULT_PAID = [
  { id: 'p1', name: 'Negro barbero', amounts: [10000], date: '2026-11-09', paidAt: '2026-11-09', notes: 'Tachado en el cuaderno original (Ya pagó)' }
];

// LocalStorage Keys
const STORAGE_KEY_PENDING = 'cuaderno_fiados_pending_v1';
const STORAGE_KEY_PAID = 'cuaderno_fiados_paid_v1';
const STORAGE_KEY_SORT = 'cuaderno_fiados_sort_v1';

// State
let pendingDebts = [];
let paidDebts = [];
let currentTab = 'pending'; // 'pending' | 'paid'
let currentSort = 'name-asc'; // 'name-asc' | 'debt-desc' | 'debt-asc' | 'recent'
let deferredPrompt = null;

// Format Colombian Pesos: 5000 -> "$ 5.000"
function formatMoney(amount) {
  if (!amount && amount !== 0) return '$ 0';
  return '$ ' + Number(amount).toLocaleString('es-CO');
}

// Audio feedback helper (Web Audio API)
function playSound(type) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } else if (type === 'add') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    }
  } catch (e) {}
}

// Haptic vibration
function vibrate(ms = 30) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}

// Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `p-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold text-white transition-all transform duration-300 pointer-events-auto border ${
    type === 'success' 
      ? 'bg-emerald-600 border-emerald-400' 
      : type === 'warning' 
      ? 'bg-amber-600 border-amber-400' 
      : 'bg-slate-800 border-slate-600'
  }`;
  toast.innerHTML = `
    <span class="text-base">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
    <span class="flex-1">${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize State
function initApp() {
  const savedPending = localStorage.getItem(STORAGE_KEY_PENDING);
  const savedPaid = localStorage.getItem(STORAGE_KEY_PAID);
  const savedSort = localStorage.getItem(STORAGE_KEY_SORT);

  if (savedPending) {
    try { pendingDebts = JSON.parse(savedPending); } catch (e) { pendingDebts = [...DEFAULT_DEBTS]; }
  } else {
    pendingDebts = [...DEFAULT_DEBTS];
    savePendingToStorage();
  }

  if (savedPaid) {
    try { paidDebts = JSON.parse(savedPaid); } catch (e) { paidDebts = [...DEFAULT_PAID]; }
  } else {
    paidDebts = [...DEFAULT_PAID];
    savePaidToStorage();
  }

  if (savedSort) {
    currentSort = savedSort;
  }
  updateSortUI();

  render();
  setupPWA();
}

function savePendingToStorage() {
  localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pendingDebts));
}

function savePaidToStorage() {
  localStorage.setItem(STORAGE_KEY_PAID, JSON.stringify(paidDebts));
}

function getPersonTotal(person) {
  if (!person.amounts || !person.amounts.length) return 0;
  return person.amounts.reduce((sum, val) => sum + (Number(val) || 0), 0);
}

function getGrandTotal() {
  return pendingDebts.reduce((sum, p) => sum + getPersonTotal(p), 0);
}

function switchTab(tab) {
  currentTab = tab;
  const tabPendingBtn = document.getElementById('tabPendingBtn');
  const tabPaidBtn = document.getElementById('tabPaidBtn');

  if (tab === 'pending') {
    tabPendingBtn.className = "py-2.5 px-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 bg-emerald-600 text-white shadow-md";
    tabPaidBtn.className = "py-2.5 px-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200";
  } else {
    tabPaidBtn.className = "py-2.5 px-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 bg-emerald-600 text-white shadow-md";
    tabPendingBtn.className = "py-2.5 px-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200";
  }
  render();
}

function toggleSortMenu() {
  const menu = document.getElementById('sortMenu');
  menu.classList.toggle('hidden');
}

function setSort(sortType) {
  currentSort = sortType;
  localStorage.setItem(STORAGE_KEY_SORT, sortType);
  document.getElementById('sortMenu').classList.add('hidden');
  updateSortUI();
  render();
}

function updateSortUI() {
  const labels = {
    'name-asc': 'A-Z',
    'debt-desc': 'Mayor $$',
    'debt-asc': 'Menor $$',
    'recent': 'Recientes'
  };
  const labelEl = document.getElementById('sortLabel');
  if (labelEl) labelEl.textContent = labels[currentSort] || 'A-Z';

  ['name-asc', 'debt-desc', 'debt-asc', 'recent'].forEach(type => {
    const checkEl = document.getElementById(`check-${type}`);
    if (checkEl) {
      if (type === currentSort) checkEl.classList.remove('hidden');
      else checkEl.classList.add('hidden');
    }
  });
}

function handleSearch() {
  const query = document.getElementById('searchInput').value.trim();
  const clearBtn = document.getElementById('clearSearchBtn');
  if (query.length > 0) {
    clearBtn.classList.remove('hidden');
  } else {
    clearBtn.classList.add('hidden');
  }
  render();
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  input.value = '';
  document.getElementById('clearSearchBtn').classList.add('hidden');
  input.focus();
  render();
}

// Render Main List
function render() {
  const listContainer = document.getElementById('debtsList');
  const emptyState = document.getElementById('emptyState');
  const grandTotalDisplay = document.getElementById('grandTotalDisplay');
  const debtorsCountBadge = document.getElementById('debtorsCountBadge');
  const pendingTabCount = document.getElementById('pendingTabCount');
  const paidTabCount = document.getElementById('paidTabCount');

  const grandTotal = getGrandTotal();
  grandTotalDisplay.textContent = formatMoney(grandTotal);
  debtorsCountBadge.textContent = `${pendingDebts.length} personas`;
  pendingTabCount.textContent = pendingDebts.length;
  paidTabCount.textContent = paidDebts.length;

  let list = currentTab === 'pending' ? [...pendingDebts] : [...paidDebts];

  const searchQuery = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  if (searchQuery) {
    list = list.filter(item => item.name.toLowerCase().includes(searchQuery));
  }

  list.sort((a, b) => {
    if (currentSort === 'name-asc') {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    } else if (currentSort === 'debt-desc') {
      return getPersonTotal(b) - getPersonTotal(a);
    } else if (currentSort === 'debt-asc') {
      return getPersonTotal(a) - getPersonTotal(b);
    } else if (currentSort === 'recent') {
      return (b.id || '').localeCompare(a.id || '');
    }
    return 0;
  });

  if (list.length === 0) {
    listContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    const emptyTitle = document.getElementById('emptyTitle');
    const emptyDesc = document.getElementById('emptyDesc');
    if (searchQuery) {
      emptyTitle.textContent = `No se encontró "${searchQuery}"`;
      emptyDesc.textContent = 'Verifica que el nombre esté bien escrito o regístralo como nuevo fiado.';
    } else if (currentTab === 'paid') {
      emptyTitle.textContent = 'Aún no hay clientes que hayan pagado';
      emptyDesc.textContent = 'Cuando alguien pague su deuda, márcalo con "Pagó" y aparecerá aquí registrado.';
    } else {
      emptyTitle.textContent = '¡Excelente! No tienes deudas pendientes';
      emptyDesc.textContent = 'Tus clientes están al día o anota un nuevo fiado con el botón de abajo.';
    }
    return;
  }

  emptyState.classList.add('hidden');

  let html = '';
  list.forEach(item => {
    const total = getPersonTotal(item);
    const isPaidTab = currentTab === 'paid';

    // Sequence of debts written side by side
    const amountsSequence = (item.amounts && item.amounts.length > 0)
      ? item.amounts.map((amt) => {
          const formattedAmt = Number(amt).toLocaleString('es-CO');
          return `<span class="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-extrabold text-sm sm:text-base font-mono cursor-pointer hover:border-amber-400" onclick="openEditDebt('${item.id}')" title="Toca para editar este valor">$${formattedAmt}</span>`;
        }).join(' <span class="text-slate-400 font-bold text-sm sm:text-base">+</span> ')
      : `<span class="text-slate-400 text-xs italic">$0</span>`;

    html += `
      <div class="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border ${isPaidTab ? 'border-slate-700/60 opacity-80' : 'border-slate-700 hover:border-emerald-500/50'} shadow-lg transition duration-200">
        <!-- Card Header: Name + Total Badge -->
        <div class="flex items-start justify-between gap-2 mb-2.5">
          <div class="flex-1 min-w-0">
            <h3 class="text-xl sm:text-2xl font-black text-white tracking-tight truncate flex items-center gap-2">
              <span>${escapeHtml(item.name)}</span>
              ${item.notes ? `<span class="text-[11px] font-normal text-slate-400">(${escapeHtml(item.notes)})</span>` : ''}
            </h3>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-[10px] font-bold uppercase tracking-wider block text-slate-400">Total a Pagar</span>
            <span class="inline-block px-3 py-1 rounded-xl ${isPaidTab ? 'bg-slate-700 text-slate-300' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'} text-base sm:text-lg font-black font-mono">
              ${formatMoney(total)}
            </span>
          </div>
        </div>

        <!-- The Sequence of debts written side-by-side -->
        <div class="mb-3.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center flex-wrap gap-1.5">
          <span class="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <span>🛒</span>
            <span>Fiados al lado:</span>
          </span>
          <div class="flex items-center flex-wrap gap-1.5">
            ${amountsSequence}
          </div>
        </div>

        <!-- Action Buttons Row -->
        <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-700/50">
          ${!isPaidTab ? `
            <button 
              onclick="openAddAmountModal('${item.id}')" 
              class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              <span class="text-base font-black leading-none">+</span>
              <span>Sumar al lado</span>
            </button>

            <button 
              onclick="openPayModal('${item.id}')" 
              class="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-emerald-950/60"
            >
              <span>✓</span>
              <span>Pagó</span>
            </button>

            <button 
              onclick="sendWhatsAppReminder('${item.id}')" 
              title="Enviar cuenta por WhatsApp"
              class="p-2.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-emerald-400 border border-slate-600/60 transition active:scale-95"
            >
              💬
            </button>

            <button 
              onclick="openEditDebt('${item.id}')" 
              title="Editar nombre o valores"
              class="p-2.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-300 border border-slate-600/60 transition active:scale-95"
            >
              ✏️
            </button>
          ` : `
            <div class="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <span class="text-emerald-400">✓ Pagado completo</span>
            </div>
            <div class="flex items-center gap-2">
              <button 
                onclick="restoreDebtToPending('${item.id}')" 
                class="py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold text-xs flex items-center gap-1.5 active:scale-95"
              >
                <span>↩</span>
                <span>Restaurar</span>
              </button>
              <button 
                onclick="deletePaidDebt('${item.id}')" 
                class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs"
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          `}
        </div>
      </div>
    `;
  });

  listContainer.innerHTML = html;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Modal Control
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

window.addEventListener('click', (e) => {
  const modals = ['modalNewDebt', 'modalAddAmount', 'modalPayDebt', 'modalEditDebt', 'modalBackup', 'modalHelp'];
  modals.forEach(mId => {
    const el = document.getElementById(mId);
    if (el && e.target === el) closeModal(mId);
  });
  const sortMenu = document.getElementById('sortMenu');
  const sortBtn = document.getElementById('sortMenuBtn');
  if (sortMenu && !sortMenu.contains(e.target) && !sortBtn.contains(e.target)) {
    sortMenu.classList.add('hidden');
  }
});

// 1. New Debt Modal
function openNewDebtModal() {
  document.getElementById('newPersonName').value = '';
  document.getElementById('newPersonAmount').value = '';
  openModal('modalNewDebt');
  setTimeout(() => document.getElementById('newPersonName').focus(), 150);
}

function setNewAmount(val) {
  const input = document.getElementById('newPersonAmount');
  const current = Number(input.value) || 0;
  input.value = current + val;
  vibrate(20);
}

function saveNewDebt() {
  const name = document.getElementById('newPersonName').value.trim();
  const amount = Number(document.getElementById('newPersonAmount').value) || 0;

  if (!name) {
    showToast('Escribe el nombre de la persona', 'warning');
    return;
  }
  if (amount <= 0) {
    showToast('Ingresa un valor mayor a $0', 'warning');
    return;
  }

  const existing = pendingDebts.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.amounts.push(amount);
    savePendingToStorage();
    closeModal('modalNewDebt');
    playSound('add');
    vibrate(40);
    showToast(`Se sumó ${formatMoney(amount)} a la cuenta de ${existing.name}`);
    render();
    return;
  }

  const newEntry = {
    id: 'd_' + Date.now(),
    name: name,
    amounts: [amount],
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };

  pendingDebts.unshift(newEntry);
  savePendingToStorage();
  closeModal('modalNewDebt');
  playSound('add');
  vibrate(50);
  showToast(`¡Cuenta de ${name} anotada correctamente!`);
  render();
}

// 2. Add Amount Beside (Sumar al lado)
function openAddAmountModal(debtId) {
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;

  document.getElementById('addAmountDebtId').value = debtId;
  document.getElementById('addAmountPersonName').textContent = person.name;
  document.getElementById('additionalAmountInput').value = '';
  
  updateSequencePreview(person, 0);

  const input = document.getElementById('additionalAmountInput');
  input.oninput = () => {
    const extra = Number(input.value) || 0;
    updateSequencePreview(person, extra);
  };

  openModal('modalAddAmount');
  setTimeout(() => input.focus(), 150);
}

function setAddAmount(val) {
  const input = document.getElementById('additionalAmountInput');
  const current = Number(input.value) || 0;
  input.value = current + val;
  const debtId = document.getElementById('addAmountDebtId').value;
  const person = pendingDebts.find(p => p.id === debtId);
  if (person) updateSequencePreview(person, Number(input.value));
  vibrate(20);
}

function updateSequencePreview(person, extraAmount) {
  const previewEl = document.getElementById('amountSequencePreview');
  const currentList = person.amounts.map(a => '$' + Number(a).toLocaleString('es-CO'));
  if (extraAmount > 0) {
    currentList.push(`+$${Number(extraAmount).toLocaleString('es-CO')} (Nuevo)`);
  }
  previewEl.textContent = currentList.join(' + ');
}

function saveAddAmount() {
  const debtId = document.getElementById('addAmountDebtId').value;
  const amount = Number(document.getElementById('additionalAmountInput').value) || 0;
  const person = pendingDebts.find(p => p.id === debtId);

  if (!person) return;
  if (amount <= 0) {
    showToast('Ingresa un valor válido para sumar', 'warning');
    return;
  }

  person.amounts.push(amount);
  savePendingToStorage();
  closeModal('modalAddAmount');
  playSound('add');
  vibrate(40);
  showToast(`Sumado ${formatMoney(amount)} a ${person.name}`);
  render();
}

// 3. Pay Debt Modal
function openPayModal(debtId) {
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;

  document.getElementById('payDebtId').value = debtId;
  document.getElementById('payPersonName').textContent = person.name;
  document.getElementById('payPersonTotal').textContent = formatMoney(getPersonTotal(person));
  document.getElementById('partialPaymentAmount').value = '';

  openModal('modalPayDebt');
}

function confirmFullPayment() {
  const debtId = document.getElementById('payDebtId').value;
  const index = pendingDebts.findIndex(p => p.id === debtId);
  if (index === -1) return;

  const person = pendingDebts[index];
  const totalPaid = getPersonTotal(person);

  const paidRecord = {
    ...person,
    paidAt: new Date().toISOString(),
    totalPaid: totalPaid
  };
  paidDebts.unshift(paidRecord);
  pendingDebts.splice(index, 1);

  savePendingToStorage();
  savePaidToStorage();
  closeModal('modalPayDebt');
  playSound('success');
  vibrate(70);
  showToast(`¡${person.name} pagó ${formatMoney(totalPaid)} completo!`);
  render();
}

function confirmPartialPayment() {
  const debtId = document.getElementById('payDebtId').value;
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;

  const abono = Number(document.getElementById('partialPaymentAmount').value) || 0;
  const currentTotal = getPersonTotal(person);

  if (abono <= 0) {
    showToast('Ingresa un monto de abono válido', 'warning');
    return;
  }
  if (abono >= currentTotal) {
    confirmFullPayment();
    return;
  }

  const remaining = currentTotal - abono;
  person.amounts = [remaining];
  person.notes = `Abonó ${formatMoney(abono)} el ${new Date().toLocaleDateString('es-CO')}`;

  savePendingToStorage();
  closeModal('modalPayDebt');
  playSound('success');
  vibrate(40);
  showToast(`Abono de ${formatMoney(abono)} registrado. Nuevo saldo: ${formatMoney(remaining)}`);
  render();
}

function restoreDebtToPending(debtId) {
  const index = paidDebts.findIndex(p => p.id === debtId);
  if (index === -1) return;

  const person = paidDebts[index];
  paidDebts.splice(index, 1);
  pendingDebts.unshift(person);

  savePendingToStorage();
  savePaidToStorage();
  vibrate(30);
  showToast(`Restaurada la cuenta de ${person.name} a pendientes`);
  render();
}

function deletePaidDebt(debtId) {
  if (!confirm('¿Eliminar este registro del historial?')) return;
  paidDebts = paidDebts.filter(p => p.id !== debtId);
  savePaidToStorage();
  showToast('Registro eliminado del historial');
  render();
}

// 4. Edit Modal
function openEditDebt(debtId) {
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;

  document.getElementById('editDebtId').value = debtId;
  document.getElementById('editPersonName').value = person.name;

  renderEditAmountsRows(person.amounts);
  openModal('modalEditDebt');
}

function renderEditAmountsRows(amounts) {
  const container = document.getElementById('editAmountsList');
  container.innerHTML = '';
  amounts.forEach((amt, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2';
    row.innerHTML = `
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">$</span>
        <input 
          type="number" 
          value="${amt}" 
          data-idx="${idx}"
          class="edit-amount-input w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
      </div>
      <button type="button" onclick="removeAmountRowFromEdit(${idx})" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-sm font-bold" title="Eliminar este valor">
        ✕
      </button>
    `;
    container.appendChild(row);
  });
}

function addAmountRowToEdit() {
  const container = document.getElementById('editAmountsList');
  const idx = container.children.length;
  const row = document.createElement('div');
  row.className = 'flex items-center gap-2';
  row.innerHTML = `
    <div class="relative flex-1">
      <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">$</span>
      <input 
        type="number" 
        value="0" 
        data-idx="${idx}"
        class="edit-amount-input w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
    </div>
    <button type="button" onclick="removeAmountRowFromEdit(${idx})" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-sm font-bold" title="Eliminar este valor">
      ✕
    </button>
  `;
  container.appendChild(row);
  row.querySelector('input').focus();
}

function removeAmountRowFromEdit(indexToRemove) {
  const inputs = Array.from(document.querySelectorAll('.edit-amount-input'));
  const newAmounts = inputs
    .filter((_, idx) => idx !== indexToRemove)
    .map(inp => Number(inp.value) || 0);
  renderEditAmountsRows(newAmounts);
}

function saveEditedDebt() {
  const debtId = document.getElementById('editDebtId').value;
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;

  const newName = document.getElementById('editPersonName').value.trim();
  if (!newName) {
    showToast('El nombre no puede estar vacío', 'warning');
    return;
  }

  const inputs = Array.from(document.querySelectorAll('.edit-amount-input'));
  const newAmounts = inputs
    .map(inp => Number(inp.value) || 0)
    .filter(amt => amt > 0);

  if (newAmounts.length === 0) {
    showToast('Debe tener al menos un valor mayor a $0', 'warning');
    return;
  }

  person.name = newName;
  person.amounts = newAmounts;

  savePendingToStorage();
  closeModal('modalEditDebt');
  playSound('add');
  showToast('Cambios guardados con éxito');
  render();
}

function deleteDebtPermanently() {
  const debtId = document.getElementById('editDebtId').value;
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;

  if (!confirm(`¿Eliminar la cuenta de ${person.name} por completo?`)) return;

  pendingDebts = pendingDebts.filter(p => p.id !== debtId);
  savePendingToStorage();
  closeModal('modalEditDebt');
  showToast(`Cuenta de ${person.name} eliminada`);
  render();
}

// 5. WhatsApp Reminder Generator
function sendWhatsAppReminder(debtId) {
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;

  const total = getPersonTotal(person);
  const amountsStr = person.amounts.map(a => '$' + Number(a).toLocaleString('es-CO')).join(' + ');

  const message = `Hola ${person.name}, te saludo cordialmente. Paso a compartirte el detalle de la cuenta en la libreta:\n\nCompras fiadas: ${amountsStr}\nTotal pendiente: ${formatMoney(total)}\n\nMuchas gracias por tu atención! 🙏`;
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

// 6. Backup & Restore
function openBackupModal() {
  openModal('modalBackup');
}

function openHelpModal() {
  openModal('modalHelp');
}

function exportBackupData() {
  const data = {
    pendingDebts,
    paidDebts,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cuaderno-cuentas-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Archivo de respaldo descargado');
}

function importBackupData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported.pendingDebts)) {
        pendingDebts = imported.pendingDebts;
        paidDebts = Array.isArray(imported.paidDebts) ? imported.paidDebts : [];
        savePendingToStorage();
        savePaidToStorage();
        closeModal('modalBackup');
        playSound('success');
        showToast('¡Copia de seguridad restaurada correctamente!');
        render();
      } else {
        showToast('El archivo no contiene un formato válido', 'warning');
      }
    } catch (err) {
      showToast('Error al leer el archivo', 'warning');
    }
  };
  reader.readAsText(file);
}

function shareFullSummaryWhatsApp() {
  const grandTotal = getGrandTotal();
  let text = `📒 *RESUMEN DE CUENTAS - LIBRETA DE FIADOS*\n`;
  text += `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}\n`;
  text += `💰 *TOTAL QUE NOS DEBEN: ${formatMoney(grandTotal)}*\n`;
  text += `👥 Total personas: ${pendingDebts.length}\n\n`;
  text += `*DETALLE DE CLIENTES:*\n`;

  pendingDebts.forEach((p, idx) => {
    const total = getPersonTotal(p);
    const sequence = p.amounts.map(a => '$' + Number(a).toLocaleString('es-CO')).join(' + ');
    text += `${idx + 1}. *${p.name}*: ${sequence} = *${formatMoney(total)}*\n`;
  });

  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

function resetToPhotoInitialData() {
  if (!confirm('¿Seguro que deseas volver a los datos originales de la foto del cuaderno? (Se perderán cambios no respaldados)')) return;
  pendingDebts = JSON.parse(JSON.stringify(DEFAULT_DEBTS));
  paidDebts = JSON.parse(JSON.stringify(DEFAULT_PAID));
  savePendingToStorage();
  savePaidToStorage();
  closeModal('modalBackup');
  playSound('success');
  showToast('¡Datos restablecidos a la lista original del cuaderno!');
  render();
}

// 7. PWA Setup
function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker Registrado'))
      .catch(err => console.error('Error al registrar Service Worker:', err));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('installAppBtn');
    const installBanner = document.getElementById('installBanner');
    if (installBtn) installBtn.classList.remove('hidden');
    if (installBanner) installBanner.classList.remove('hidden');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const installBtn = document.getElementById('installAppBtn');
    const installBanner = document.getElementById('installBanner');
    if (installBtn) installBtn.classList.add('hidden');
    if (installBanner) installBanner.classList.add('hidden');
    showToast('¡Aplicación instalada en tu celular con éxito!');
  });
}

function promptInstallPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        showToast('Instalando aplicación...');
      }
      deferredPrompt = null;
    });
  } else {
    openHelpModal();
  }
}

document.addEventListener('DOMContentLoaded', initApp);

