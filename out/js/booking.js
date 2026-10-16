/* Integra a agenda online (Firebase) ao fluxo existente, sem alterar a lógica do app.js:
   - bloqueia horários já reservados e horários passados
   - reserva o horário de forma atômica antes de abrir o WhatsApp */
(function () {
  const $ = (id) => document.getElementById(id);

  /* Aguarda o módulo Firebase (com limite de tempo para não travar o app) */
  function getDB() {
    return new Promise((resolve) => {
      if (window.MimosDB) return resolve(window.MimosDB);
      const t = setTimeout(() => resolve({ enabled: false }), 6000);
      window.addEventListener('mimosdb-ready', () => { clearTimeout(t); resolve(window.MimosDB); }, { once: true });
    });
  }

  function isPast(dateIso, time) {
    const [y, m, d] = dateIso.split('-').map(Number);
    const now = new Date();
    if (new Date(y, m - 1, d).toDateString() !== now.toDateString()) return false;
    const [hh, mm] = time.split(':').map(Number);
    return hh * 60 + mm <= now.getHours() * 60 + now.getMinutes();
  }

  function markBusy(hour, label) {
    const btn = $('slot-btn-' + hour.replace(':', ''));
    if (!btn) return;
    btn.disabled = true;
    btn.title = label;
    btn.classList.add('opacity-50', 'cursor-not-allowed', 'line-through', 'bg-gray-100');
    btn.classList.remove('hover:border-purple-500', 'bg-white', 'bg-pink-600', 'text-white');
    btn.innerHTML = `<i class="fa-solid fa-lock text-gray-400 text-xs"></i> ${hour}`;
    if (currentBooking.time === hour) currentBooking.time = null;
  }

  async function refreshSlots() {
    const date = currentBooking.date;
    if (!date || !$('slots-container')) return;

    AVAILABLE_HOURS.forEach((h) => { if (isPast(date, h)) markBusy(h, 'Horário já passou'); });

    const db = await getDB();
    if (!db.enabled) return;
    let busy;
    try { busy = await db.busySlots(date); } catch (e) { console.error('Agenda online indisponível', e); return; }
    if (currentBooking.date !== date) return; // usuária trocou de data durante a consulta

    const realPros = PROFESSIONALS.filter((p) => !p.isAny).map((p) => p.id);
    const pro = currentBooking.professional;
    AVAILABLE_HOURS.forEach((h) => {
      const taken = new Set(busy.filter((s) => s.time === h).map((s) => s.proId));
      const full = pro && !pro.isAny
        ? taken.has(pro.id)
        : realPros.length > 0 && realPros.every((id) => taken.has(id));
      if (full) markBusy(h, 'Horário ocupado');
    });
  }

  /* ---- Wrappers das funções globais do app.js ---- */
  const origRender = window.renderTimeSlots;
  window.renderTimeSlots = function () { origRender(); refreshSlots(); };

  const origGoTo = window.goToStep;
  window.goToStep = function (step) {
    origGoTo(step);
    if (step === 3) refreshSlots();
  };

  const origConfirm = window.confirmAppointment;
  let working = false;
  window.confirmAppointment = async function () {
    if (working) return;
    const b = currentBooking;
    const name = $('client-name').value.trim();
    const phone = $('client-phone').value.trim();
    // Validações de formulário ficam com a função original
    if (!name || !phone || phone.length < 8 || !b.service || !b.professional || !b.date || !b.time) return origConfirm();

    working = true;
    const btn = document.querySelector('[onclick="confirmAppointment()"]');
    if (btn) { btn.disabled = true; btn.classList.add('opacity-70'); }

    try {
      const db = await getDB();
      if (db.enabled) {
        const proIds = b.professional.isAny
          ? PROFESSIONALS.filter((p) => !p.isAny).map((p) => p.id)
          : [b.professional.id];
        try {
          const chosen = await db.book({
            date: b.date,
            time: b.time,
            proIds,
            booking: {
              proName: b.professional.name,
              serviceId: b.service.id,
              serviceName: b.service.name,
              price: b.service.price,
              duration: b.service.duration,
              dateLabel: b.formattedDate,
              clientName: name,
              clientPhone: phone,
              notes: $('client-notes').value.trim()
            }
          });
          // "Qualquer disponível": passa a constar a profissional que de fato ficou com o horário
          const assigned = PROFESSIONALS.find((p) => p.id === chosen);
          if (assigned) currentBooking.professional = assigned;
        } catch (e) {
          if (e && e.message === 'SLOT_TAKEN') {
            showToast('Esse horário acabou de ser reservado por outra cliente. Escolha outro! 💜');
            currentBooking.time = null;
            goToStep(3);
            return;
          }
          console.error('Falha ao reservar online; seguindo sem bloqueio', e);
        }
      }
      origConfirm();
    } finally {
      working = false;
      if (btn) { btn.disabled = false; btn.classList.remove('opacity-70'); }
    }
  };
})();
