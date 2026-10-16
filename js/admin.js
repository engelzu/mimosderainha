/* Painel Admin - CRUD de Serviços e Profissionais (persistência em localStorage) */
(function () {
  const ADMIN_PASSWORD = '789512';
  const SESSION_KEY = 'mimos_admin_auth';
  const ICONS = [
    'fa-hand-sparkles', 'fa-gem', 'fa-wand-magic-sparkles', 'fa-shield-heart', 'fa-eye',
    'fa-spray-can-sparkles', 'fa-brush', 'fa-feather', 'fa-spa', 'fa-scissors',
    'fa-heart', 'fa-star', 'fa-crown', 'fa-face-smile-beam', 'fa-leaf', 'fa-droplet'
  ];

  const $ = (id) => document.getElementById(id);
  let activeTab = 'bookings';
  const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80';

  /* ---------- Utilidades ---------- */
  const brl = (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ',');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clean = (s) => String(s).replace(/['"`\\]/g, '').trim(); // evita quebrar atributos onclick do site
  const slug = (s) => clean(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function toast(msg) {
    const t = $('admin-toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.add('hidden'), 2500);
  }

  function persist() {
    localStorage.setItem(MIMOS_KEYS.services, JSON.stringify(SERVICES));
    localStorage.setItem(MIMOS_KEYS.professionals, JSON.stringify(PROFESSIONALS));
  }

  /* ---------- Login ---------- */
  function showPanel() {
    $('login-view').classList.add('hidden');
    $('panel-view').classList.remove('hidden');
    switchTab(activeTab);
  }

  /* Aguarda o módulo Firebase (carregado após este script) */
  function getDB() {
    return new Promise((resolve) => {
      if (window.MimosDB) return resolve(window.MimosDB);
      const t = setTimeout(() => resolve({ enabled: false }), 6000);
      window.addEventListener('mimosdb-ready', () => { clearTimeout(t); resolve(window.MimosDB); }, { once: true });
    });
  }

  $('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const typed = $('login-password').value;
    if (typed === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      $('login-error').classList.add('hidden');
      // Entra também no Firebase para poder ler/cancelar agendamentos online
      getDB().then((db) => db.enabled && db.adminLogin(typed)).catch((err) => console.error('Login Firebase admin', err));
      showPanel();
    } else {
      $('login-error').classList.remove('hidden');
      $('login-password').value = '';
      $('login-password').focus();
    }
  });

  $('btn-logout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  /* ---------- Abas ---------- */
  const TAB_ON = 'px-4 py-2 rounded-full text-sm font-semibold transition-all text-white bg-purple-600 shadow';
  const TAB_OFF = 'px-4 py-2 rounded-full text-sm font-semibold transition-all text-gray-600 bg-white border border-pink-200 hover:text-purple-700';

  function switchTab(tab) {
    activeTab = tab;
    $('tab-bookings').className = tab === 'bookings' ? TAB_ON : TAB_OFF;
    $('tab-services').className = tab === 'services' ? TAB_ON : TAB_OFF;
    $('tab-professionals').className = tab === 'professionals' ? TAB_ON : TAB_OFF;
    $('tab-settings').className = tab === 'settings' ? TAB_ON : TAB_OFF;
    $('section-bookings').classList.toggle('hidden', tab !== 'bookings');
    $('section-services').classList.toggle('hidden', tab !== 'services');
    $('section-professionals').classList.toggle('hidden', tab !== 'professionals');
    $('section-settings').classList.toggle('hidden', tab !== 'settings');
    const crud = tab === 'services' || tab === 'professionals';
    $('btn-new').classList.toggle('hidden', !crud);
    $('btn-reset').classList.toggle('hidden', !crud);
    $('btn-new-label').textContent = tab === 'services' ? 'Novo serviço' : 'Nova profissional';
    render();
  }
  $('tab-bookings').addEventListener('click', () => switchTab('bookings'));
  $('tab-services').addEventListener('click', () => switchTab('services'));
  $('tab-professionals').addEventListener('click', () => switchTab('professionals'));
  $('tab-settings').addEventListener('click', () => switchTab('settings'));

  /* ---------- Renderização ---------- */
  function render() {
    if (activeTab === 'bookings') renderBookings();
    else if (activeTab === 'services') renderServices();
    else if (activeTab === 'professionals') renderProfessionals();
    else renderSettings();
  }

  /* ---------- Agendamentos online (Firebase) ---------- */
  async function renderBookings() {
    const list = $('bookings-list');
    list.innerHTML = '<p class="text-sm text-gray-400 py-8 text-center"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Carregando agendamentos...</p>';
    const db = await getDB();
    if (!db.enabled) {
      list.innerHTML = '<div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">Agenda online indisponível. Verifique a conexão e as credenciais do Firebase em js/config.js.</div>';
      return;
    }
    try {
      const items = (await db.listBookings()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      if (!items.length) {
        list.innerHTML = '<div class="bg-white rounded-2xl p-10 text-center border border-pink-100 text-sm text-gray-400"><i class="fa-regular fa-calendar-xmark text-4xl text-purple-200 mb-2 block"></i>Nenhum agendamento ainda.</div>';
        return;
      }
      const todayIso = new Date().toISOString().slice(0, 10);
      list.innerHTML = items.map((b) => {
        const [y, m, d] = b.date.split('-');
        const past = b.date < todayIso;
        const wa = String(b.clientPhone || '').replace(/\D/g, '');
        return `
        <article class="bg-white rounded-2xl p-4 sm:p-5 border border-pink-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 ${past ? 'opacity-60' : ''}">
          <div class="shrink-0 w-20 text-center bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl py-2 border border-pink-100">
            <div class="text-[10px] font-bold uppercase text-pink-600">${d}/${m}/${y}</div>
            <div class="text-xl font-bold text-purple-800">${esc(b.time)}</div>
          </div>
          <div class="flex-1 min-w-0 space-y-0.5">
            <h3 class="font-bold text-gray-800 text-sm truncate">${esc(b.serviceName)} <span class="text-emerald-600">• ${brl(b.price)}</span></h3>
            <p class="text-xs text-gray-500"><i class="fa-solid fa-user text-purple-400 mr-1"></i>${esc(b.clientName)} • <a class="text-emerald-600 font-semibold" target="_blank" href="https://wa.me/55${wa.replace(/^55/, '')}">${esc(b.clientPhone)}</a></p>
            <p class="text-xs text-gray-500"><i class="fa-solid fa-crown text-pink-400 mr-1"></i>Profissional: ${esc(b.proName)}</p>
            ${b.notes ? `<p class="text-xs text-gray-400"><i class="fa-regular fa-comment mr-1"></i>${esc(b.notes)}</p>` : ''}
          </div>
          <button data-cancel="${esc(b.id)}" class="self-end sm:self-center px-3 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100"><i class="fa-solid fa-ban mr-1"></i>Cancelar &amp; liberar</button>
        </article>`;
      }).join('');
    } catch (err) {
      console.error(err);
      list.innerHTML = '<div class="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 space-y-1"><p class="font-bold">Não foi possível ler os agendamentos.</p><p>Confirme no Firebase: (1) Authentication com e-mail/senha ativo e usuário admin criado; (2) regras do Firestore publicadas. Depois, saia e entre novamente no admin.</p></div>';
    }
  }

  $('btn-refresh-bookings').addEventListener('click', renderBookings);

  async function cancelBooking(id) {
    if (!askDeletePassword('este agendamento e liberar o horário')) return;
    const db = await getDB();
    try {
      await db.cancelBooking(id);
      toast('Agendamento cancelado. Horário liberado!');
    } catch (err) {
      console.error(err);
      toast('Erro ao cancelar. Verifique o login do Firebase.');
    }
    renderBookings();
  }

  /* ---------- Configurações (WhatsApp da loja) ---------- */
  function formatPhone(digits) {
    const d = digits.replace(/^55/, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return d;
  }

  function normalizePhone(raw) {
    let d = raw.replace(/\D/g, '');
    if (d.length === 10 || d.length === 11) d = '55' + d;
    return /^\d{12,13}$/.test(d) ? d : null;
  }

  function renderSettings() {
    $('set-whatsapp').value = formatPhone(SALON_WHATSAPP);
    $('set-whatsapp-link').textContent = 'wa.me/' + SALON_WHATSAPP;
  }

  $('set-whatsapp').addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
    e.target.value = d.length > 2 ? formatPhone(d) : d;
    const n = normalizePhone(d);
    $('set-whatsapp-link').textContent = n ? 'wa.me/' + n : '—';
  });

  $('form-settings').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = normalizePhone($('set-whatsapp').value);
    if (!n) return toast('Informe um número válido com DDD.');
    SALON_WHATSAPP = n;
    localStorage.setItem(MIMOS_KEYS.whatsapp, n);
    renderSettings();
    toast('WhatsApp da loja atualizado!');
  });

  function renderServices() {
    const q = $('search-services').value.toLowerCase();
    const list = SERVICES.filter((s) => (s.name + ' ' + s.category).toLowerCase().includes(q));
    $('category-options').innerHTML = [...new Set(SERVICES.map((s) => s.category))].map((c) => `<option value="${esc(c)}">`).join('');

    if (!list.length) {
      $('services-list').innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 text-sm"><i class="fa-regular fa-folder-open text-4xl text-purple-200 mb-2 block"></i>Nenhum serviço cadastrado.</div>`;
      return;
    }

    $('services-list').innerHTML = list.map((s) => `
      <article class="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm hover:shadow-md hover:border-pink-300 transition-all flex gap-4 relative">
        <div class="w-12 h-12 shrink-0 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-purple-600 text-xl">
          <i class="fa-solid ${esc(s.icon || 'fa-gem')}"></i>
        </div>
        <div class="flex-1 min-w-0">
          ${s.badge ? `<span class="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">${esc(s.badge)}</span>` : ''}
          <h3 class="font-bold text-gray-800 text-sm pr-20 truncate">${esc(s.name)}</h3>
          <div class="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span><i class="fa-regular fa-clock text-pink-400"></i> ${esc(s.duration)}</span>
            <span class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium text-[11px]">${esc(s.category)}</span>
          </div>
          <p class="text-xs text-gray-400 line-clamp-2 mt-1.5">${esc(s.description)}</p>
          <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span class="text-lg font-bold text-gray-800">${brl(s.price)}</span>
            <div class="flex gap-1.5">
              <button data-edit="${esc(s.id)}" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100"><i class="fa-solid fa-pen mr-1"></i>Editar</button>
              <button data-del="${esc(s.id)}" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100"><i class="fa-solid fa-trash-can mr-1"></i>Excluir</button>
            </div>
          </div>
        </div>
      </article>`).join('');
  }

  function renderProfessionals() {
    $('professionals-list').innerHTML = PROFESSIONALS.map((p) => `
      <article class="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
        <img src="${esc(p.avatar)}" alt="${esc(p.name)}" class="w-20 h-20 rounded-full object-cover border-2 border-pink-200 p-0.5 mb-3 bg-pink-50">
        <h3 class="font-bold text-gray-800">${esc(p.name)}</h3>
        <p class="text-xs text-gray-500 mb-4">${esc(p.role)}</p>
        <div class="flex gap-1.5 w-full">
          <button data-edit="${esc(p.id)}" class="flex-1 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100"><i class="fa-solid fa-pen mr-1"></i>Editar</button>
          ${p.isAny ? '' : `<button data-del="${esc(p.id)}" class="flex-1 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100"><i class="fa-solid fa-trash-can mr-1"></i>Excluir</button>`}
        </div>
      </article>`).join('');
  }

  $('search-services').addEventListener('input', renderServices);

  /* Delegação de eventos Editar / Excluir / Cancelar */
  document.addEventListener('click', (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-del]');
    const close = e.target.closest('[data-close]');
    const cancel = e.target.closest('[data-cancel]');
    if (close) $(close.dataset.close).classList.add('hidden');
    if (edit) activeTab === 'services' ? openServiceModal(edit.dataset.edit) : openProfessionalModal(edit.dataset.edit);
    if (del) activeTab === 'services' ? deleteService(del.dataset.del) : deleteProfessional(del.dataset.del);
    if (cancel) cancelBooking(cancel.dataset.cancel);
  });

  $('btn-new').addEventListener('click', () => {
    activeTab === 'services' ? openServiceModal() : openProfessionalModal();
  });

  /* ---------- CRUD Serviços ---------- */
  function renderIconPicker(selected) {
    $('svc-icon').value = selected;
    $('icon-picker').innerHTML = ICONS.map((ic) => `
      <button type="button" data-icon="${ic}" class="w-10 h-10 rounded-xl border flex items-center justify-center text-base transition-all ${ic === selected ? 'bg-purple-600 text-white border-purple-600 shadow' : 'bg-pink-50 text-purple-600 border-pink-200 hover:border-purple-400'}">
        <i class="fa-solid ${ic}"></i>
      </button>`).join('');
  }
  $('icon-picker').addEventListener('click', (e) => {
    const b = e.target.closest('[data-icon]');
    if (b) renderIconPicker(b.dataset.icon);
  });

  function openServiceModal(id) {
    const s = SERVICES.find((x) => x.id === id);
    $('modal-service-title').textContent = s ? 'Editar serviço' : 'Novo serviço';
    $('svc-id').value = s ? s.id : '';
    $('svc-name').value = s ? s.name : '';
    $('svc-category').value = s ? s.category : '';
    $('svc-price').value = s ? s.price : '';
    $('svc-duration').value = s ? s.duration : '';
    $('svc-badge').value = s ? (s.badge || '') : '';
    $('svc-description').value = s ? s.description : '';
    renderIconPicker(s ? (s.icon || ICONS[0]) : ICONS[0]);
    $('modal-service').classList.remove('hidden');
    $('svc-name').focus();
  }

  $('form-service').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('svc-id').value;
    const data = {
      name: clean($('svc-name').value),
      category: clean($('svc-category').value),
      price: parseFloat($('svc-price').value) || 0,
      duration: clean($('svc-duration').value),
      description: $('svc-description').value.trim(),
      icon: $('svc-icon').value || ICONS[0],
      badge: clean($('svc-badge').value)
    };
    if (!data.badge) delete data.badge;

    if (id) {
      const idx = SERVICES.findIndex((x) => x.id === id);
      SERVICES[idx] = { id, ...data };
      toast('Serviço atualizado!');
    } else {
      let newId = slug(data.name) || 'servico';
      while (SERVICES.some((x) => x.id === newId)) newId += '-' + Math.floor(Math.random() * 1000);
      SERVICES.push({ id: newId, ...data });
      toast('Serviço criado!');
    }
    persist();
    $('modal-service').classList.add('hidden');
    renderServices();
  });

  function askDeletePassword(label) {
    const typed = prompt(`Para excluir ${label}, digite a senha do administrador:`);
    if (typed === null) return false;
    if (typed !== ADMIN_PASSWORD) {
      toast('Senha incorreta. Exclusão cancelada.');
      return false;
    }
    return true;
  }

  function deleteService(id) {
    const s = SERVICES.find((x) => x.id === id);
    if (!s || !askDeletePassword(`o serviço "${s.name}"`)) return;
    SERVICES.splice(SERVICES.indexOf(s), 1);
    persist();
    renderServices();
    toast('Serviço excluído.');
  }

  /* ---------- CRUD Profissionais ---------- */
  function openProfessionalModal(id) {
    const p = PROFESSIONALS.find((x) => x.id === id);
    $('modal-professional-title').textContent = p ? 'Editar profissional' : 'Nova profissional';
    $('pro-id').value = p ? p.id : '';
    $('pro-name').value = p ? p.name : '';
    $('pro-role').value = p ? p.role : '';
    $('pro-avatar').value = p ? p.avatar : '';
    $('pro-avatar-preview').src = p ? p.avatar : DEFAULT_AVATAR;
    $('pro-avatar-name').textContent = 'JPG ou PNG. Será recortada em formato quadrado.';
    $('pro-avatar-file').value = '';
    $('modal-professional').classList.remove('hidden');
    $('pro-name').focus();
  }

  /* Upload de foto: redimensiona para 200px e guarda como base64 */
  $('pro-avatar-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const side = Math.min(img.width, img.height);
        canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        $('pro-avatar').value = canvas.toDataURL('image/jpeg', 0.85);
        $('pro-avatar-preview').src = $('pro-avatar').value;
        $('pro-avatar-name').textContent = file.name;
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  $('form-professional').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = $('pro-id').value;
    const name = clean($('pro-name').value);
    const role = clean($('pro-role').value);
    const avatar = $('pro-avatar').value.trim() || DEFAULT_AVATAR;

    if (id) {
      const p = PROFESSIONALS.find((x) => x.id === id);
      Object.assign(p, { name, role, avatar });
      toast('Profissional atualizada!');
    } else {
      let newId = slug(name) || 'pro';
      while (PROFESSIONALS.some((x) => x.id === newId)) newId += '-' + Math.floor(Math.random() * 1000);
      PROFESSIONALS.push({ id: newId, name, role, avatar });
      toast('Profissional criada!');
    }
    persist();
    $('modal-professional').classList.add('hidden');
    renderProfessionals();
  });

  function deleteProfessional(id) {
    const p = PROFESSIONALS.find((x) => x.id === id);
    if (!p || p.isAny || !askDeletePassword(`"${p.name}"`)) return;
    PROFESSIONALS.splice(PROFESSIONALS.indexOf(p), 1);
    persist();
    renderProfessionals();
    toast('Profissional excluída.');
  }

  /* ---------- Restaurar padrão ---------- */
  $('btn-reset').addEventListener('click', () => {
    if (!confirm('Restaurar serviços e profissionais para os valores originais? Suas alterações serão perdidas.')) return;
    localStorage.removeItem(MIMOS_KEYS.services);
    localStorage.removeItem(MIMOS_KEYS.professionals);
    location.reload();
  });

  /* ---------- Init ---------- */
  if (sessionStorage.getItem(SESSION_KEY) === '1') showPanel();
  else $('login-password').focus();
})();
