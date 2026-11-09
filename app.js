// ==========================================
// CUADERNO DE CUENTAS - LIBRETA DE FIADOS
// Diseño Dark Minimalista & Sin Saturación
// ==========================================

const DEFAULT_DEBTS = [
  { id: 'd1', name: 'Cristian', amounts: [5000], date: '2026-11-09', notes: '' },
  { id: 'd2', name: 'Corona', amounts: [7000], date: '2026-11-09', notes: '' },
  { id: 'd3', name: 'Enrrique', amounts: [20000, 15000], date: '2026-11-09', notes: '20.000 + 15.000' },
  { id: 'd4', name: 'Hija del Donal', amounts: [37000], date: '2026-11-09', notes: '' },
  { id: 'd5', name: 'Patricia', amounts: [5000, 8000], date: '2026-11-09', notes: '5.000 + 8.000' },
  { id: 'd6', name: 'Miamigo', amounts: [30000], date: '2026-11-09', notes: '' },
  { id: 'd7', name: 'Chilo', amounts: [5000, 10000], date: '2026-11-09', notes: '5.000 + 10.000' },
  { id: 'd8', name: 'Rovison', amounts: [50000], date: '2026-11-09', notes: '' },
  { id: 'd9', name: 'Mario', amounts: [37000, 12000, 10000], date: '2026-11-09', notes: '37.000 + 12.000 + 10.000' },
  { id: 'd10', name: 'Caterine', amounts: [20000, 20000], date: '2026-11-09', notes: '20.000 + 20.000' },
  { id: 'd11', name: 'Rafael', amounts: [7000, 11000], date: '2026-11-09', notes: '7.000 + 11.000' },
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
  { id: 'p1', name: 'Negro barbero', amounts: [10000], date: '2026-11-09', paidAt: '2026-11-09', notes: 'Ya pagó' }
];

const STORAGE_KEY_PENDING = 'cuaderno_fiados_pending_v1';
const STORAGE_KEY_PAID = 'cuaderno_fiados_paid_v1';
const STORAGE_KEY_SORT = 'cuaderno_fiados_sort_v1';
const STORAGE_KEY_VOICE = 'cuaderno_fiados_voice_v1';

let pendingDebts = [];
let paidDebts = [];
let currentTab = 'pending';
let currentSort = 'name-asc';
let deferredPrompt = null;
let voiceEnabled = true;

let recognition = null;
let isListening = false;
let voiceTargetPersonId = null;

function formatMoney(amount) {
  if (!amount && amount !== 0) return '$ 0';
  return '$ ' + Number(amount).toLocaleString('es-CO');
}

// ==========================================
// TEXT-TO-SPEECH (ASISTENTE DE VOZ)
// ==========================================
function initVoice() {
  const saved = localStorage.getItem(STORAGE_KEY_VOICE);
  if (saved !== null) {
    voiceEnabled = saved === 'true';
  } else {
    voiceEnabled = true;
  }
  updateVoiceUI();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}

function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  localStorage.setItem(STORAGE_KEY_VOICE, String(voiceEnabled));
  updateVoiceUI();
  vibrate(30);
  if (voiceEnabled) {
    showToast('🔊 Voz activada');
    speak('Voz activada');
  } else {
    showToast('🔇 Voz silenciada', 'warning');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
}

function updateVoiceUI() {
  const icon = document.getElementById('voiceIcon');
  const btn = document.getElementById('voiceToggleBtn');
  if (icon) icon.textContent = voiceEnabled ? '🔊' : '🔇';
  if (btn) {
    if (voiceEnabled) {
      btn.className = "p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 transition active:scale-95 text-sm";
      btn.title = "Voz activada (Toca para silenciar)";
    } else {
      btn.className = "p-2 rounded-xl bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700 transition active:scale-95 text-sm";
      btn.title = "Voz silenciada (Toca para activar)";
    }
  }
}

function speak(text) {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-CO';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => 
      v.lang === 'es-CO' || 
      v.lang.startsWith('es-419') || 
      v.lang.startsWith('es-US') || 
      v.lang.startsWith('es-MX') || 
      v.lang.startsWith('es')
    );
    if (spanishVoice) utterance.voice = spanishVoice;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('TTS error:', e);
  }
}

function playSound(type) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.28);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.28);
    } else if (type === 'add') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.14);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.14);
    }
  } catch (e) {}
}

function vibrate(ms = 30) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(ms); } catch (e) {}
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `p-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold text-white transition-all transform duration-300 pointer-events-auto border ${
    type === 'success' 
      ? 'bg-slate-900 border-emerald-500/60 text-emerald-300' 
      : type === 'warning' 
        ? 'bg-slate-900 border-amber-500/60 text-amber-300' 
        : 'bg-slate-900 border-slate-700 text-slate-200'
  }`;
  toast.innerHTML = `<span class="text-sm">${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}</span><span class="flex-1">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 250);
  }, 2500);
}

// ==========================================
// SPEECH-TO-TEXT (DICTADO POR VOZ)
// ==========================================
function parseVoiceInput(text) {
  if (!text || typeof text !== 'string') return null;

  let raw = text.trim();
  let cleaned = raw.toLowerCase()
    .replace(/[,\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const prefixes = [
    /^anotarle a\s+/i, /^anotar a\s+/i, /^anotale a\s+/i, /^apuntale a\s+/i,
    /^apuntar a\s+/i, /^registra a\s+/i, /^registrar a\s+/i, /^agrega a\s+/i,
    /^agregar a\s+/i, /^cuenta de\s+/i, /^fiado de\s+/i, /^fiado a\s+/i,
    /^sumar a\s+/i, /^suma a\s+/i, /^cobro a\s+/i
  ];
  for (const prefix of prefixes) cleaned = cleaned.replace(prefix, '');
  cleaned = cleaned.replace(/\s+(pesos|de fiado|en fiado|deuda)\s*$/i, '').trim();

  const units = {
    'cero': 0, 'un': 1, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
    'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
    'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
    'dieciseis': 16, 'dieciséis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19,
    'veinte': 20, 'veintiuno': 21, 'veintiún': 21, 'veintidos': 22, 'veintidós': 22,
    'veintitres': 23, 'veintitrés': 23, 'veinticuatro': 24, 'veinticinco': 25,
    'veintiseis': 26, 'veintiséis': 26, 'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29,
    'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60, 'setenta': 70,
    'ochenta': 80, 'noventa': 90
  };

  const hundreds = {
    'cien': 100, 'ciento': 100, 'doscientos': 200, 'trescientos': 300,
    'cuatrocientos': 400, 'quinientos': 500, 'seiscientos': 600,
    'setecientos': 700, 'ochocientos': 800, 'novecientos': 900
  };

  function wordsToNumber(phrase) {
    const tokens = phrase.trim().split(/\s+/).filter(t => t !== 'y');
    let total = 0;
    let current = 0;

    for (let i = 0; i < tokens.length; i++) {
      const w = tokens[i];
      if (/^\d+$/.test(w)) {
        current += parseInt(w, 10);
      } else if (units[w] !== undefined) {
        current += units[w];
      } else if (hundreds[w] !== undefined) {
        current += hundreds[w];
      } else if (w === 'mil') {
        if (current === 0) current = 1;
        current *= 1000;
        total += current;
        current = 0;
      } else if (w === 'millon' || w === 'millones') {
        if (current === 0) current = 1;
        current *= 1000000;
        total += current;
        current = 0;
      } else {
        return null;
      }
    }
    return total + current;
  }

  let name = '';
  let amount = null;

  if (cleaned.includes(' debe ')) {
    const parts = cleaned.split(' debe ');
    name = parts[0].trim();
    amount = wordsToNumber(parts.slice(1).join(' ').trim());
  }

  if (!amount) {
    const tokens = cleaned.split(/\s+/);
    for (let i = 0; i < tokens.length; i++) {
      const candidateTail = tokens.slice(i).join(' ');
      const parsed = wordsToNumber(candidateTail);
      if (parsed !== null && parsed > 0) {
        name = tokens.slice(0, i).join(' ');
        amount = parsed;
        break;
      }
    }
  }

  name = name.trim();
  if (name) {
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return { name, amount, raw };
}

function startVoiceDictation(targetDebtId = null) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('Tu celular no tiene reconocimiento de voz activo. Usa el micrófono de tu teclado.', 'warning');
    if (!targetDebtId) openNewDebtModal();
    return;
  }

  voiceTargetPersonId = targetDebtId;
  const bubble = document.getElementById('voiceMicBubble');
  const title = document.getElementById('voiceStatusTitle');
  const subtitle = document.getElementById('voiceStatusSubtitle');
  const transcriptEl = document.getElementById('voiceTranscriptText');
  const detectedCard = document.getElementById('voiceDetectedCard');

  transcriptEl.textContent = '(Habla hacia el celular...)';
  detectedCard.classList.add('hidden');

  if (voiceTargetPersonId) {
    const target = pendingDebts.find(p => p.id === voiceTargetPersonId);
    title.textContent = `Sumar fiado a: ${target ? target.name : 'Cliente'}`;
    subtitle.innerHTML = `Di el valor a sumarle. Ej: <span class="text-sky-300 font-semibold">"diez mil"</span> o <span class="text-sky-300 font-semibold">"25000"</span>`;
  } else {
    title.textContent = 'Dictar por Voz';
    subtitle.innerHTML = `Di por ejemplo: <span class="text-sky-300 font-semibold">"Mario 15 mil"</span> o <span class="text-sky-300 font-semibold">"Rafael 7000"</span>`;
  }

  bubble.className = "w-16 h-16 mx-auto rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-2xl text-sky-400 mic-listening mb-2.5";

  openModal('modalVoiceDictation');
  vibrate(30);
  initRecognitionInstance();
}

function initRecognitionInstance() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'es-CO';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    document.getElementById('voiceMicBubble').classList.add('mic-listening');
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      else interimTranscript += event.results[i][0].transcript;
    }

    const currentText = (finalTranscript || interimTranscript).trim();
    document.getElementById('voiceTranscriptText').textContent = `"${currentText}"`;

    const parsed = parseVoiceInput(currentText);
    if (parsed) updateVoiceDetectedCard(parsed);
  };

  recognition.onerror = (event) => {
    console.warn('Speech error:', event.error);
    document.getElementById('voiceMicBubble').classList.remove('mic-listening');
    if (event.error === 'not-allowed') {
      document.getElementById('voiceStatusSubtitle').textContent = '⚠️ Permiso de micrófono denegado en el navegador.';
    }
  };

  recognition.onend = () => {
    isListening = false;
    document.getElementById('voiceMicBubble').classList.remove('mic-listening');
  };

  try {
    recognition.start();
  } catch (err) {}
}

function updateVoiceDetectedCard(parsed) {
  const detectedCard = document.getElementById('voiceDetectedCard');
  const nameInput = document.getElementById('voiceParsedName');
  const amountInput = document.getElementById('voiceParsedAmount');
  const badgeType = document.getElementById('voiceDetectedType');
  const previewMsg = document.getElementById('voiceDetectedPreviewMsg');

  detectedCard.classList.remove('hidden');

  let personName = '';
  if (voiceTargetPersonId) {
    const target = pendingDebts.find(p => p.id === voiceTargetPersonId);
    personName = target ? target.name : (parsed.name || '');
    badgeType.textContent = 'Sumar a cliente';
  } else {
    personName = parsed.name || '';
    const existing = pendingDebts.find(p => p.name.toLowerCase() === personName.toLowerCase());
    if (existing) badgeType.textContent = 'Cliente existente (Se sumará)';
    else badgeType.textContent = 'Nueva Persona';
  }

  nameInput.value = personName;
  if (parsed.amount) {
    amountInput.value = parsed.amount;
    previewMsg.textContent = `Registrar ${formatMoney(parsed.amount)} a ${personName || 'esta persona'}.`;
  }
}

function restartVoiceListening() {
  document.getElementById('voiceTranscriptText').textContent = '(Habla ahora...)';
  document.getElementById('voiceDetectedCard').classList.add('hidden');
  initRecognitionInstance();
  vibrate(20);
}

function stopVoiceDictation(close = false) {
  if (recognition) {
    try { recognition.stop(); } catch (e) {}
  }
  isListening = false;
  voiceTargetPersonId = null;
  if (close) closeModal('modalVoiceDictation');
}

function confirmVoiceRecord() {
  const name = document.getElementById('voiceParsedName').value.trim();
  const amount = Number(document.getElementById('voiceParsedAmount').value) || 0;

  if (!name && !voiceTargetPersonId) {
    showToast('Por favor indica el nombre de la persona', 'warning');
    return;
  }
  if (amount <= 0) {
    showToast('Por favor indica un valor mayor a $0', 'warning');
    return;
  }

  if (voiceTargetPersonId) {
    const person = pendingDebts.find(p => p.id === voiceTargetPersonId);
    if (person) {
      person.amounts.push(amount);
      savePendingToStorage();
      stopVoiceDictation(true);
      playSound('add');
      vibrate(40);
      const newTotal = getPersonTotal(person);
      showToast(`Sumado ${formatMoney(amount)} a ${person.name}`);
      speak(`Sumado ${amount.toLocaleString('es-CO')} pesos a ${person.name}. Total: ${newTotal.toLocaleString('es-CO')} pesos.`);
      render();
      return;
    }
  }

  const existing = pendingDebts.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.amounts.push(amount);
    savePendingToStorage();
    stopVoiceDictation(true);
    playSound('add');
    vibrate(40);
    const total = getPersonTotal(existing);
    showToast(`Sumado ${formatMoney(amount)} a ${existing.name}`);
    speak(`Sumado ${amount.toLocaleString('es-CO')} pesos a ${existing.name}. Total: ${total.toLocaleString('es-CO')} pesos.`);
    render();
    return;
  }

  pendingDebts.unshift({
    id: 'd_' + Date.now(),
    name,
    amounts: [amount],
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  savePendingToStorage();
  stopVoiceDictation(true);
  playSound('add');
  vibrate(50);
  showToast(`¡Cuenta de ${name} anotada!`);
  speak(`Registrado: ${name}. Debe ${amount.toLocaleString('es-CO')} pesos.`);
  render();
}

// ==========================================
// APP INITIALIZATION & STORAGE
// ==========================================
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
  if (savedSort) currentSort = savedSort;
  updateSortUI();
  initVoice();
  render();
  setupPWA();
}

function savePendingToStorage() { localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(pendingDebts)); }
function savePaidToStorage() { localStorage.setItem(STORAGE_KEY_PAID, JSON.stringify(paidDebts)); }
function getPersonTotal(person) {
  if (!person.amounts || !person.amounts.length) return 0;
  return person.amounts.reduce((sum, val) => sum + (Number(val) || 0), 0);
}
function getGrandTotal() { return pendingDebts.reduce((sum, p) => sum + getPersonTotal(p), 0); }

function switchTab(tab) {
  currentTab = tab;
  const tabPendingBtn = document.getElementById('tabPendingBtn');
  const tabPaidBtn = document.getElementById('tabPaidBtn');
  if (tab === 'pending') {
    tabPendingBtn.className = "py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 bg-emerald-600 text-white";
    tabPaidBtn.className = "py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200";
  } else {
    tabPaidBtn.className = "py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 bg-emerald-600 text-white";
    tabPendingBtn.className = "py-2 px-3 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 text-slate-400 hover:text-slate-200";
  }
  render();
}

function toggleSortMenu() { document.getElementById('sortMenu').classList.toggle('hidden'); }
function setSort(sortType) {
  currentSort = sortType;
  localStorage.setItem(STORAGE_KEY_SORT, sortType);
  document.getElementById('sortMenu').classList.add('hidden');
  updateSortUI();
  render();
}

function updateSortUI() {
  const labels = { 'name-asc': 'A-Z', 'debt-desc': 'Mayor $$', 'debt-asc': 'Menor $$', 'recent': 'Recientes' };
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
  if (query.length > 0) clearBtn.classList.remove('hidden');
  else clearBtn.classList.add('hidden');
  render();
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  input.value = '';
  document.getElementById('clearSearchBtn').classList.add('hidden');
  input.focus();
  render();
}

// ==========================================
// RENDER NOTEBOOK CARDS (CLEAN & MINIMALIST)
// ==========================================
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
  if (searchQuery) list = list.filter(item => item.name.toLowerCase().includes(searchQuery));

  list.sort((a, b) => {
    if (currentSort === 'name-asc') return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    if (currentSort === 'debt-desc') return getPersonTotal(b) - getPersonTotal(a);
    if (currentSort === 'debt-asc') return getPersonTotal(a) - getPersonTotal(b);
    if (currentSort === 'recent') return (b.id || '').localeCompare(a.id || '');
    return 0;
  });

  if (list.length === 0) {
    listContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    const emptyTitle = document.getElementById('emptyTitle');
    const emptyDesc = document.getElementById('emptyDesc');
    if (searchQuery) {
      emptyTitle.textContent = `No se encontró "${searchQuery}"`;
      emptyDesc.textContent = 'Verifica que el nombre esté bien escrito o anota un nuevo fiado.';
    } else if (currentTab === 'paid') {
      emptyTitle.textContent = 'Aún no hay clientes en historial';
      emptyDesc.textContent = 'Cuando un cliente pague completo aparecerá aquí.';
    } else {
      emptyTitle.textContent = '¡Excelente! No hay deudas pendientes';
      emptyDesc.textContent = 'Todos tus clientes están al día.';
    }
    return;
  }
  emptyState.classList.add('hidden');

  let html = '';
  list.forEach(item => {
    const total = getPersonTotal(item);
    const isPaidTab = currentTab === 'paid';

    // Sequence of purchases: e.g. $37.000 + $12.000 + $10.000
    const amountsSequence = (item.amounts && item.amounts.length > 0)
      ? item.amounts.map((amt) => {
          const formattedAmt = Number(amt).toLocaleString('es-CO');
          return `<span class="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-200 font-bold font-mono text-xs sm:text-sm cursor-pointer hover:border-slate-500" onclick="openEditDebt('${item.id}')" title="Toca para editar">$${formattedAmt}</span>`;
        }).join(' <span class="text-slate-500 font-bold text-xs sm:text-sm">+</span> ')
      : `<span class="text-slate-500 text-xs italic">$0</span>`;

    html += `
      <div class="card-appear p-3.5 sm:p-4 rounded-xl bg-[#1e293b] border ${isPaidTab ? 'border-slate-800 opacity-75' : 'border-slate-700/70 hover:border-slate-600'} shadow-sm">
        
        <!-- Row 1: Name and Total -->
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="flex-1 min-w-0">
            <h3 class="text-base sm:text-lg font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              <span>${escapeHtml(item.name)}</span>
              ${item.notes ? `<span class="text-[11px] font-normal text-slate-400">(${escapeHtml(item.notes)})</span>` : ''}
            </h3>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-base sm:text-lg font-black ${isPaidTab ? 'text-slate-400' : 'text-emerald-400'} font-mono">
              ${formatMoney(total)}
            </span>
          </div>
        </div>

        <!-- Row 2: Purchases breakdown (Anclado al lado) -->
        <div class="mb-3 flex items-center flex-wrap gap-1.5">
          ${amountsSequence}
        </div>

        <!-- Row 3: Action Buttons (Only 2 main + 1 more options) -->
        <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          ${!isPaidTab ? `
            <button onclick="openAddAmountModal('${item.id}')" class="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition">
              <span class="text-sm font-bold">+</span>
              <span>Sumar</span>
            </button>
            <button onclick="openPayModal('${item.id}')" class="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition shadow-sm">
              <span>✓</span>
              <span>Pagó</span>
            </button>
            <button onclick="openCardOptions('${item.id}')" title="Más opciones (WhatsApp, Editar, Eliminar)" class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition">
              ⋮
            </button>
          ` : `
            <div class="text-xs text-slate-400 font-medium flex items-center gap-1">
              <span class="text-emerald-400 font-bold">✓ Pagado completo</span>
            </div>
            <div class="flex items-center gap-1.5">
              <button onclick="restoreDebtToPending('${item.id}')" class="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1 active:scale-95">
                <span>↩</span><span>Restaurar</span>
              </button>
              <button onclick="deletePaidDebt('${item.id}')" class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs" title="Eliminar">
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
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

window.addEventListener('click', (e) => {
  ['modalVoiceDictation', 'modalNewDebt', 'modalAddAmount', 'modalPayDebt', 'modalCardOptions', 'modalEditDebt', 'modalMenu', 'modalHelp'].forEach(mId => {
    const el = document.getElementById(mId);
    if (el && e.target === el) {
      if (mId === 'modalVoiceDictation') stopVoiceDictation(true);
      else closeModal(mId);
    }
  });
  const sortMenu = document.getElementById('sortMenu');
  const sortBtn = document.getElementById('sortMenuBtn');
  if (sortMenu && !sortMenu.contains(e.target) && !sortBtn.contains(e.target)) sortMenu.classList.add('hidden');
});

// Card Options (3 dots menu)
function openCardOptions(debtId) {
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;
  document.getElementById('cardOptionsDebtId').value = debtId;
  document.getElementById('cardOptionsName').textContent = person.name;
  openModal('modalCardOptions');
}

function handleOptionWhatsApp() {
  const debtId = document.getElementById('cardOptionsDebtId').value;
  closeModal('modalCardOptions');
  sendWhatsAppReminder(debtId);
}

function handleOptionEdit() {
  const debtId = document.getElementById('cardOptionsDebtId').value;
  closeModal('modalCardOptions');
  openEditDebt(debtId);
}

function handleOptionDelete() {
  const debtId = document.getElementById('cardOptionsDebtId').value;
  closeModal('modalCardOptions');
  deleteDebtPermanentlyById(debtId);
}

// 1. New Debt Modal (Manual)
function openNewDebtModal() {
  document.getElementById('newPersonName').value = '';
  document.getElementById('newPersonAmount').value = '';
  openModal('modalNewDebt');
  setTimeout(() => document.getElementById('newPersonName').focus(), 120);
}

function setNewAmount(val) {
  const input = document.getElementById('newPersonAmount');
  input.value = (Number(input.value) || 0) + val;
  vibrate(15);
}

function saveNewDebt() {
  const name = document.getElementById('newPersonName').value.trim();
  const amount = Number(document.getElementById('newPersonAmount').value) || 0;
  if (!name) { showToast('Escribe el nombre de la persona', 'warning'); return; }
  if (amount <= 0) { showToast('Ingresa un valor mayor a $0', 'warning'); return; }

  const existing = pendingDebts.find(p => p.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.amounts.push(amount);
    savePendingToStorage();
    closeModal('modalNewDebt');
    playSound('add');
    vibrate(30);
    const total = getPersonTotal(existing);
    showToast(`Sumado ${formatMoney(amount)} a ${existing.name}`);
    speak(`Sumado ${amount.toLocaleString('es-CO')} pesos a ${existing.name}. Total: ${total.toLocaleString('es-CO')} pesos.`);
    render();
    return;
  }

  pendingDebts.unshift({ id: 'd_' + Date.now(), name, amounts: [amount], date: new Date().toISOString().split('T')[0], notes: '' });
  savePendingToStorage();
  closeModal('modalNewDebt');
  playSound('add');
  vibrate(40);
  showToast(`¡Cuenta de ${name} anotada!`);
  speak(`Registrado: ${name}. Debe ${amount.toLocaleString('es-CO')} pesos.`);
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
  input.oninput = () => updateSequencePreview(person, Number(input.value) || 0);
  openModal('modalAddAmount');
  setTimeout(() => input.focus(), 120);
}

function setAddAmount(val) {
  const input = document.getElementById('additionalAmountInput');
  input.value = (Number(input.value) || 0) + val;
  const debtId = document.getElementById('addAmountDebtId').value;
  const person = pendingDebts.find(p => p.id === debtId);
  if (person) updateSequencePreview(person, Number(input.value));
  vibrate(15);
}

function updateSequencePreview(person, extraAmount) {
  const previewEl = document.getElementById('amountSequencePreview');
  const currentList = person.amounts.map(a => '$' + Number(a).toLocaleString('es-CO'));
  if (extraAmount > 0) currentList.push(`+$${Number(extraAmount).toLocaleString('es-CO')} (Nuevo)`);
  previewEl.textContent = currentList.join(' + ');
}

function saveAddAmount() {
  const debtId = document.getElementById('addAmountDebtId').value;
  const amount = Number(document.getElementById('additionalAmountInput').value) || 0;
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;
  if (amount <= 0) { showToast('Ingresa un valor válido para sumar', 'warning'); return; }
  person.amounts.push(amount);
  savePendingToStorage();
  closeModal('modalAddAmount');
  playSound('add');
  vibrate(30);
  const newTotal = getPersonTotal(person);
  showToast(`Sumado ${formatMoney(amount)} a ${person.name}`);
  speak(`Sumado ${amount.toLocaleString('es-CO')} pesos a ${person.name}. Total: ${newTotal.toLocaleString('es-CO')} pesos.`);
  render();
}

// 3. Pay Debt Modal (Cobrar / Abono)
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
  paidDebts.unshift({ ...person, paidAt: new Date().toISOString(), totalPaid });
  pendingDebts.splice(index, 1);
  savePendingToStorage();
  savePaidToStorage();
  closeModal('modalPayDebt');
  playSound('success');
  vibrate(50);
  showToast(`¡${person.name} pagó ${formatMoney(totalPaid)} completo!`);
  speak(`Cuenta pagada: ${person.name} pagó ${totalPaid.toLocaleString('es-CO')} pesos completo.`);
  render();
}

function confirmPartialPayment() {
  const debtId = document.getElementById('payDebtId').value;
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;
  const abono = Number(document.getElementById('partialPaymentAmount').value) || 0;
  const currentTotal = getPersonTotal(person);
  if (abono <= 0) { showToast('Ingresa un monto de abono válido', 'warning'); return; }
  if (abono >= currentTotal) { confirmFullPayment(); return; }
  const remaining = currentTotal - abono;
  person.amounts = [remaining];
  person.notes = `Abonó ${formatMoney(abono)}`;
  savePendingToStorage();
  closeModal('modalPayDebt');
  playSound('success');
  vibrate(30);
  showToast(`Abono registrado. Nuevo saldo: ${formatMoney(remaining)}`);
  speak(`Abono registrado: ${person.name} pagó ${abono.toLocaleString('es-CO')} pesos. Le queda debiendo ${remaining.toLocaleString('es-CO')} pesos.`);
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
  vibrate(20);
  showToast(`Restaurada la cuenta de ${person.name}`);
  speak(`Cuenta de ${person.name} restaurada a pendientes.`);
  render();
}

function deletePaidDebt(debtId) {
  if (!confirm('¿Eliminar este registro del historial?')) return;
  const person = paidDebts.find(p => p.id === debtId);
  const name = person ? person.name : 'Cliente';
  paidDebts = paidDebts.filter(p => p.id !== debtId);
  savePaidToStorage();
  showToast('Registro eliminado');
  speak(`Registro de ${name} eliminado.`);
  render();
}

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
        <input type="number" value="${amt}" data-idx="${idx}" class="edit-amount-input w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500">
      </div>
      <button type="button" onclick="removeAmountRowFromEdit(${idx})" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold" title="Eliminar valor">✕</button>
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
      <input type="number" value="0" data-idx="${idx}" class="edit-amount-input w-full pl-7 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-emerald-500">
    </div>
    <button type="button" onclick="removeAmountRowFromEdit(${idx})" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold" title="Eliminar valor">✕</button>
  `;
  container.appendChild(row);
  row.querySelector('input').focus();
}

function removeAmountRowFromEdit(indexToRemove) {
  const inputs = Array.from(document.querySelectorAll('.edit-amount-input'));
  const newAmounts = inputs.filter((_, idx) => idx !== indexToRemove).map(inp => Number(inp.value) || 0);
  renderEditAmountsRows(newAmounts);
}

function saveEditedDebt() {
  const debtId = document.getElementById('editDebtId').value;
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;
  const newName = document.getElementById('editPersonName').value.trim();
  if (!newName) { showToast('El nombre no puede estar vacío', 'warning'); return; }
  const inputs = Array.from(document.querySelectorAll('.edit-amount-input'));
  const newAmounts = inputs.map(inp => Number(inp.value) || 0).filter(amt => amt > 0);
  if (newAmounts.length === 0) { showToast('Debe tener al menos un valor mayor a $0', 'warning'); return; }
  person.name = newName;
  person.amounts = newAmounts;
  savePendingToStorage();
  closeModal('modalEditDebt');
  playSound('add');
  const total = getPersonTotal(person);
  showToast('Cambios guardados');
  speak(`Cuenta actualizada: ${person.name}. Total: ${total.toLocaleString('es-CO')} pesos.`);
  render();
}

function deleteDebtPermanentlyById(debtId) {
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;
  if (!confirm(`¿Eliminar la cuenta de ${person.name} por completo?`)) return;
  const name = person.name;
  pendingDebts = pendingDebts.filter(p => p.id !== debtId);
  savePendingToStorage();
  showToast(`Cuenta de ${name} eliminada`);
  speak(`Cuenta de ${name} eliminada.`);
  render();
}

function sendWhatsAppReminder(debtId) {
  const person = pendingDebts.find(p => p.id === debtId);
  if (!person) return;
  const total = getPersonTotal(person);
  const amountsStr = person.amounts.map(a => '$' + Number(a).toLocaleString('es-CO')).join(' + ');
  const message = `Hola ${person.name}, te comparto el detalle de tu cuenta en la libreta:\n\nCompras fiadas: ${amountsStr}\nTotal pendiente: ${formatMoney(total)}\n\n¡Muchas gracias! 🙏`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function openMenuModal() { openModal('modalMenu'); }
function openHelpModal() { openModal('modalHelp'); }

function exportBackupData() {
  const data = { pendingDebts, paidDebts, exportDate: new Date().toISOString(), version: '3.0' };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cuaderno-cuentas-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Respaldo descargado');
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
        closeModal('modalMenu');
        playSound('success');
        showToast('¡Respaldo restaurado!');
        speak('Copia de respaldo restaurada con éxito.');
        render();
      } else { showToast('El archivo no tiene un formato válido', 'warning'); }
    } catch (err) { showToast('Error al leer el archivo', 'warning'); }
  };
  reader.readAsText(file);
}

function shareFullSummaryWhatsApp() {
  const grandTotal = getGrandTotal();
  let text = `📒 *RESUMEN DE CUENTAS - LIBRETA DE FIADOS*\n`;
  text += `📅 Fecha: ${new Date().toLocaleDateString('es-CO')}\n`;
  text += `💰 *TOTAL QUE NOS DEBEN: ${formatMoney(grandTotal)}*\n`;
  text += `👥 Personas: ${pendingDebts.length}\n\n`;
  text += `*DETALLE DE CLIENTES:*\n`;
  pendingDebts.forEach((p, idx) => {
    const total = getPersonTotal(p);
    const sequence = p.amounts.map(a => '$' + Number(a).toLocaleString('es-CO')).join(' + ');
    text += `${idx + 1}. *${p.name}*: ${sequence} = *${formatMoney(total)}*\n`;
  });
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

function resetToPhotoInitialData() {
  if (!confirm('¿Restablecer los datos a como estaban en la foto del cuaderno?')) return;
  pendingDebts = JSON.parse(JSON.stringify(DEFAULT_DEBTS));
  paidDebts = JSON.parse(JSON.stringify(DEFAULT_PAID));
  savePendingToStorage();
  savePaidToStorage();
  closeModal('modalMenu');
  playSound('success');
  showToast('¡Datos de la libreta restablecidos!');
  speak('Datos restablecidos a la libreta original.');
  render();
}

function setupPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBanner = document.getElementById('installBanner');
    if (installBanner) installBanner.classList.remove('hidden');
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const installBanner = document.getElementById('installBanner');
    if (installBanner) installBanner.classList.add('hidden');
    showToast('¡Aplicación instalada con éxito!');
  });
}

function promptInstallPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') showToast('Instalando aplicación...');
      deferredPrompt = null;
    });
  } else {
    openHelpModal();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
