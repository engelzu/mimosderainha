    // ESTADO DA APLICAÇÃO
    let currentStep = 1;
    let selectedCategory = 'Todos';
    let currentBooking = {
      service: null,
      professional: null,
      date: null,
      formattedDate: null,
      time: null,
      clientName: '',
      clientPhone: '',
      clientNotes: ''
    };

    // INICIALIZAÇÃO
    window.addEventListener('DOMContentLoaded', () => {
      renderCategories();
      renderServices();
      renderProfessionals();
      setupDateSelectors();
      updateReservationsCount();
    });

    // CONTROLE DE NAVEGAÇÃO DE ABAS
    function switchTab(tab) {
      const viewAgendar = document.getElementById('view-agendar');
      const viewReservas = document.getElementById('view-reservas');
      const btnAgendar = document.getElementById('nav-btn-agendar');
      const btnReservas = document.getElementById('nav-btn-reservas');

      if (tab === 'agendar') {
        viewAgendar.classList.remove('hidden');
        viewReservas.classList.add('hidden');
        btnAgendar.className = 'px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all text-purple-800 bg-purple-100 hover:bg-purple-200';
        btnReservas.className = 'px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all text-gray-600 hover:text-purple-700 hover:bg-pink-50 relative';
      } else {
        viewAgendar.classList.add('hidden');
        viewReservas.classList.remove('hidden');
        btnReservas.className = 'px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all text-purple-800 bg-purple-100 hover:bg-purple-200 relative';
        btnAgendar.className = 'px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all text-gray-600 hover:text-purple-700 hover:bg-pink-50';
        renderReservations();
      }
    }

    // PASSO A PASSO
    function goToStep(step) {
      if (step > 1 && !currentBooking.service) {
        showToast('Por favor, selecione um serviço primeiro!');
        return;
      }
      if (step > 2 && !currentBooking.professional) {
        showToast('Escolha uma profissional para continuar!');
        return;
      }
      if (step > 3 && (!currentBooking.date || !currentBooking.time)) {
        showToast('Selecione uma data e um horário disponível!');
        return;
      }

      currentStep = step;

      // Atualiza visualização das seções
      for (let i = 1; i <= 4; i++) {
        const sec = document.getElementById(`step-section-${i}`);
        const badge = document.getElementById(`step-badge-${i}`);
        if (i === step) {
          sec.classList.remove('hidden');
          badge.className = 'w-9 h-9 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-md transition-all scale-105 ring-4 ring-purple-100';
        } else if (i < step) {
          sec.classList.add('hidden');
          badge.className = 'w-9 h-9 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-sm transition-all';
          badge.innerHTML = '<i class="fa-solid fa-check text-xs"></i>';
        } else {
          sec.classList.add('hidden');
          badge.className = 'w-9 h-9 rounded-full bg-gray-200 text-gray-600 font-bold flex items-center justify-center text-sm transition-all';
          badge.innerText = i;
        }
      }

      // Linha de progresso
      const progressWidths = ['0%', '33%', '66%', '100%'];
      document.getElementById('step-line').style.width = progressWidths[step - 1];

      // Preparar conteúdo dos passos
      if (step === 2) renderSelectedServiceSummary();
      if (step === 4) renderCheckoutSummary();

      window.scrollTo({ top: 80, behavior: 'smooth' });
    }

    // RENDERIZAR CATEGORIAS
    function renderCategories() {
      const categories = ['Todos', ...new Set(SERVICES.map(s => s.category))];
      const container = document.getElementById('category-filters');
      container.innerHTML = categories.map(cat => `
        <button onclick="setCategory('${cat}')" 
          class="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            selectedCategory === cat 
            ? 'bg-purple-600 border-purple-600 text-white shadow-sm' 
            : 'bg-white border-pink-200 text-gray-600 hover:border-purple-300 hover:text-purple-600'
          }">
          ${cat}
        </button>
      `).join('');
    }

    function setCategory(cat) {
      selectedCategory = cat;
      renderCategories();
      renderServices();
    }

    // RENDERIZAR SERVIÇOS
    function renderServices() {
      const grid = document.getElementById('services-grid');
      const search = (document.getElementById('search-input')?.value || '').toLowerCase();

      const filtered = SERVICES.filter(s => {
        const matchesCategory = selectedCategory === 'Todos' || s.category === selectedCategory;
        const matchesSearch = s.name.toLowerCase().includes(search) || s.description.toLowerCase().includes(search);
        return matchesCategory && matchesSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full py-12 text-center text-gray-400">
            <i class="fa-regular fa-folder-open text-4xl text-purple-200 mb-2"></i>
            <p class="text-sm">Nenhum serviço encontrado para sua busca.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = filtered.map(item => `
        <div class="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-pink-300 relative">
          ${item.badge ? `<span class="absolute top-4 right-4 bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">${item.badge}</span>` : ''}
          
          <div>
            <div class="w-12 h-12 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-purple-600 text-xl mb-4 group-hover:scale-110 transition-transform">
              <i class="fa-solid ${item.icon}"></i>
            </div>
            
            <h3 class="font-bold text-gray-800 text-base group-hover:text-purple-700 transition-colors">${item.name}</h3>
            
            <div class="flex items-center gap-3 text-xs text-gray-500 mt-1 mb-2">
              <span class="flex items-center gap-1"><i class="fa-regular fa-clock text-pink-400"></i> ${item.duration}</span>
              <span>•</span>
              <span class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium text-[11px]">${item.category}</span>
            </div>

            <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">${item.description}</p>
          </div>

          <div class="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
            <div>
              <span class="text-[10px] text-gray-400 block uppercase tracking-wider font-semibold">Valor</span>
              <span class="text-lg font-bold text-gray-800">R$ ${item.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <button onclick="selectService('${item.id}')" class="px-4 py-2 rounded-xl text-xs font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 hover:text-pink-800 border border-pink-200 flex items-center gap-1.5 transition-all">
              <i class="fa-regular fa-calendar-plus"></i> Reservar
            </button>
          </div>
        </div>
      `).join('');
    }

    function filterServices() {
      renderServices();
    }

    function selectService(serviceId) {
      const service = SERVICES.find(s => s.id === serviceId);
      currentBooking.service = service;
      goToStep(2);
    }

    // RENDERIZAR SUMÁRIO DO PASSO 2
    function renderSelectedServiceSummary() {
      const summaryEl = document.getElementById('selected-service-summary');
      const s = currentBooking.service;
      if (!s) return;

      summaryEl.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-base">
            <i class="fa-solid ${s.icon}"></i>
          </div>
          <div>
            <span class="text-xs text-purple-600 font-semibold uppercase tracking-wider">Procedimento Selecionado</span>
            <h4 class="font-bold text-gray-800 text-sm sm:text-base">${s.name}</h4>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs text-gray-500 block">${s.duration}</span>
          <span class="text-base font-bold text-purple-900">R$ ${s.price.toFixed(2).replace('.', ',')}</span>
        </div>
      `;
    }

    // RENDERIZAR PROFISSIONAIS
    function renderProfessionals() {
      const grid = document.getElementById('professionals-grid');
      grid.innerHTML = PROFESSIONALS.map(pro => `
        <div onclick="selectProfessional('${pro.id}')" 
             id="card-pro-${pro.id}"
             class="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm hover:border-purple-300 cursor-pointer transition-all flex flex-col items-center text-center group hover:-translate-y-1">
          <div class="relative mb-3">
            <img src="${pro.avatar}" alt="${pro.name}" class="w-20 h-20 rounded-full object-cover border-2 border-pink-200 group-hover:border-purple-400 p-0.5 shadow-sm">
            ${pro.isAny ? `<div class="absolute -bottom-1 -right-1 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow"><i class="fa-solid fa-sparkles"></i></div>` : ''}
          </div>
          <h4 class="font-bold text-gray-800 text-base">${pro.name}</h4>
          <p class="text-xs text-gray-500 mt-0.5 mb-4">${pro.role}</p>
          <button class="w-full py-2 bg-pink-50 group-hover:bg-purple-600 text-pink-700 group-hover:text-white rounded-xl text-xs font-bold transition-all">
            Selecionar
          </button>
        </div>
      `).join('');
    }

    function selectProfessional(proId) {
      currentBooking.professional = PROFESSIONALS.find(p => p.id === proId);
      goToStep(3);
    }

    // CONFIGURAR DATAS E HORÁRIOS
    function setupDateSelectors() {
      const container = document.getElementById('date-buttons-container');
      const today = new Date();
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      let html = '';
      for (let i = 0; i < 6; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        // Se for domingo, pula se o salão não abrir (opcional, aqui mantemos com visual de folga ou funcional)
        const isToday = i === 0;
        const isoDate = d.toISOString().split('T')[0];
        const labelDia = isToday ? 'Hoje' : diasSemana[d.getDay()];
        const formatted = `${d.getDate()} de ${meses[d.getMonth()]}`;

        html += `
          <button type="button" onclick="selectDate('${isoDate}', '${labelDia}, ${formatted}')" 
                  id="date-btn-${isoDate}"
                  class="date-pill px-4 py-2.5 rounded-xl border border-pink-200 bg-white hover:border-purple-400 text-left transition-all flex flex-col items-center min-w-[76px]">
            <span class="text-[10px] font-bold text-pink-600 uppercase">${labelDia}</span>
            <span class="text-base font-bold text-gray-800">${d.getDate()}</span>
            <span class="text-[10px] text-gray-400">${meses[d.getMonth()]}</span>
          </button>
        `;
      }
      container.innerHTML = html;

      // Seleciona a data de hoje por padrão
      const defaultIso = today.toISOString().split('T')[0];
      const defaultLabel = `Hoje, ${today.getDate()} de ${meses[today.getMonth()]}`;
      selectDate(defaultIso, defaultLabel);
    }

    function selectDate(isoDate, label) {
      currentBooking.date = isoDate;
      currentBooking.formattedDate = label;
      
      document.getElementById('selected-date-label').innerText = label;

      // Destaque visual
      document.querySelectorAll('.date-pill').forEach(btn => {
        btn.classList.remove('bg-purple-600', 'text-white', 'border-purple-600', 'shadow-md');
        btn.classList.add('bg-white', 'text-gray-800');
        const spanTitle = btn.querySelector('span:first-child');
        if (spanTitle) spanTitle.className = 'text-[10px] font-bold text-pink-600 uppercase';
      });

      const activeBtn = document.getElementById(`date-btn-${isoDate}`);
      if (activeBtn) {
        activeBtn.classList.remove('bg-white', 'text-gray-800');
        activeBtn.classList.add('bg-purple-600', 'text-white', 'border-purple-600', 'shadow-md');
        const spanTitle = activeBtn.querySelector('span:first-child');
        if (spanTitle) spanTitle.className = 'text-[10px] font-bold text-pink-200 uppercase';
      }

      renderTimeSlots();
    }

    function onCustomDatePicked(isoDate) {
      if (!isoDate) return;
      const parts = isoDate.split('-');
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const label = `${diasSemana[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]}`;
      selectDate(isoDate, label);
    }

    function renderTimeSlots() {
      const container = document.getElementById('slots-container');
      container.innerHTML = AVAILABLE_HOURS.map(hour => `
        <button onclick="selectTime('${hour}')" 
                id="slot-btn-${hour.replace(':', '')}"
                class="slot-pill py-3 px-2 rounded-xl border border-pink-200 bg-white hover:border-purple-500 font-bold text-xs sm:text-sm text-gray-700 transition-all flex items-center justify-center gap-1.5">
          <i class="fa-regular fa-clock text-purple-400 text-xs"></i> ${hour}
        </button>
      `).join('');
    }

    function selectTime(hour) {
      currentBooking.time = hour;

      document.querySelectorAll('.slot-pill').forEach(btn => {
        btn.classList.remove('bg-pink-600', 'text-white', 'border-pink-600', 'shadow-md');
        btn.classList.add('bg-white', 'text-gray-700');
      });

      const active = document.getElementById(`slot-btn-${hour.replace(':', '')}`);
      if (active) {
        active.classList.remove('bg-white', 'text-gray-700');
        active.classList.add('bg-pink-600', 'text-white', 'border-pink-600', 'shadow-md');
      }

      // Avança diretamente para confirmação
      setTimeout(() => {
        goToStep(4);
      }, 200);
    }

    // RESUMO DA RESERVA (PASSO 4)
    function renderCheckoutSummary() {
      const container = document.getElementById('booking-checkout-summary');
      const b = currentBooking;

      container.innerHTML = `
        <div class="bg-white p-3.5 rounded-xl border border-pink-100 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
            <i class="fa-solid ${b.service?.icon || 'fa-gem'}"></i>
          </div>
          <div>
            <span class="text-[10px] text-gray-400 block uppercase font-bold">Procedimento</span>
            <span class="font-bold text-gray-800 text-sm">${b.service?.name}</span>
            <span class="text-xs text-purple-600 block">Duração: ${b.service?.duration}</span>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl border border-pink-100 flex items-center gap-3">
          <img src="${b.professional?.avatar}" class="w-10 h-10 rounded-full object-cover border border-purple-200">
          <div>
            <span class="text-[10px] text-gray-400 block uppercase font-bold">Profissional</span>
            <span class="font-bold text-gray-800 text-sm">${b.professional?.name}</span>
            <span class="text-xs text-gray-500 block">${b.professional?.role}</span>
          </div>
        </div>

        <div class="bg-white p-3.5 rounded-xl border border-pink-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa-regular fa-calendar text-purple-500"></i>
            <div>
              <span class="text-[10px] text-gray-400 block uppercase font-bold">Data & Horário</span>
              <span class="font-bold text-gray-800 text-xs">${b.formattedDate} às ${b.time}</span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-pink-200 flex items-center justify-between">
          <span class="font-bold text-gray-700">Total a Pagar</span>
          <span class="text-xl font-extrabold text-purple-700">R$ ${b.service?.price.toFixed(2).replace('.', ',')}</span>
        </div>
      `;
    }

    // CONFIRMAÇÃO DO AGENDAMENTO & INTEGRAÇÃO WHATSAPP
    function confirmAppointment() {
      const name = document.getElementById('client-name').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const notes = document.getElementById('client-notes').value.trim();

      if (!name) {
        showToast('Por favor, informe seu nome!');
        document.getElementById('client-name').focus();
        return;
      }
      if (!phone || phone.length < 8) {
        showToast('Informe um número de WhatsApp válido!');
        document.getElementById('client-phone').focus();
        return;
      }

      currentBooking.clientName = name;
      currentBooking.clientPhone = phone;
      currentBooking.clientNotes = notes;

      const appointmentRecord = {
        id: 'REQ-' + Date.now().toString().slice(-6),
        serviceName: currentBooking.service.name,
        servicePrice: currentBooking.service.price,
        serviceDuration: currentBooking.service.duration,
        professional: currentBooking.professional.name,
        date: currentBooking.formattedDate,
        time: currentBooking.time,
        clientName: name,
        clientPhone: phone,
        notes: notes,
        createdAt: new Date().toISOString()
      };

      // Salva no LocalStorage
      saveToStorage(appointmentRecord);
      updateReservationsCount();

      // Monta Mensagem para o WhatsApp
      const linha = '━━━━━━━━━━━━━━━━━━';
      const msg = encodeURIComponent(
        `👑 *MIMOS DE RAINHA* 👑\n` +
        `_Espaço & Beleza_ 💜\n` +
        `${linha}\n` +
        `🌸 *NOVO AGENDAMENTO* 🌸\n` +
        `${linha}\n\n` +
        `Olá! Gostaria de reservar o seguinte horário:\n\n` +
        `💎 *SERVIÇO*\n` +
        `✨ ${appointmentRecord.serviceName}\n` +
        `⏳ Duração: ${appointmentRecord.serviceDuration}\n` +
        `💰 Valor: *R$ ${appointmentRecord.servicePrice.toFixed(2).replace('.', ',')}*\n\n` +
        `🗓️ *DATA E HORÁRIO*\n` +
        `📅 ${appointmentRecord.date}\n` +
        `⏰ ${appointmentRecord.time}\n\n` +
        `💅 *PROFISSIONAL*\n` +
        `👩‍🎨 ${appointmentRecord.professional}\n\n` +
        `👤 *CLIENTE*\n` +
        `🙋‍♀️ ${appointmentRecord.clientName}\n` +
        `📱 ${appointmentRecord.clientPhone}\n` +
        (notes ? `\n📝 *OBSERVAÇÕES*\n💬 ${notes}\n` : ``) +
        `\n${linha}\n` +
        `🔖 Reserva: *#${appointmentRecord.id}*\n` +
        `💳 Pagamento no local (Cartão, PIX ou Dinheiro)\n` +
        `${linha}\n\n` +
        `_Aguardo a confirmação! Obrigada!_ 💖✨`
      );

      const waLink = `https://wa.me/${SALON_WHATSAPP}?text=${msg}`;

      // Configura e abre o Modal de Sucesso
      document.getElementById('btn-modal-whatsapp').href = waLink;
      document.getElementById('modal-summary-content').innerHTML = `
        <p><strong>Procedimento:</strong> ${appointmentRecord.serviceName}</p>
        <p><strong>Com:</strong> ${appointmentRecord.professional}</p>
        <p><strong>Data:</strong> ${appointmentRecord.date} às ${appointmentRecord.time}</p>
        <p><strong>Cliente:</strong> ${appointmentRecord.clientName}</p>
      `;

      document.getElementById('modal-success').classList.remove('hidden');

      // Tenta abrir a aba do WhatsApp em paralelo
      window.open(waLink, '_blank');
    }

    function closeSuccessModal() {
      document.getElementById('modal-success').classList.add('hidden');
      // Limpa dados temporários e volta ao passo 1
      currentBooking = {
        service: null,
        professional: null,
        date: null,
        formattedDate: null,
        time: null,
        clientName: '',
        clientPhone: '',
        clientNotes: ''
      };
      document.getElementById('client-name').value = '';
      document.getElementById('client-phone').value = '';
      document.getElementById('client-notes').value = '';
      goToStep(1);
      switchTab('reservas');
    }

    // PERSISTÊNCIA EM LOCALSTORAGE
    function saveToStorage(item) {
      try {
        const stored = JSON.parse(localStorage.getItem('mimos_reservations') || '[]');
        stored.unshift(item);
        localStorage.setItem('mimos_reservations', JSON.stringify(stored));
      } catch (e) {
        console.error('Erro ao salvar no LocalStorage', e);
      }
    }

    function getStoredReservations() {
      try {
        return JSON.parse(localStorage.getItem('mimos_reservations') || '[]');
      } catch (e) {
        return [];
      }
    }

    function removeReservation(id) {
      try {
        let stored = getStoredReservations();
        stored = stored.filter(item => item.id !== id);
        localStorage.setItem('mimos_reservations', JSON.stringify(stored));
        renderReservations();
        updateReservationsCount();
        showToast('Reserva removida da sua lista. Para liberar o horário, avise a loja pelo WhatsApp.');
      } catch (e) {
        console.error(e);
      }
    }

    function updateReservationsCount() {
      const count = getStoredReservations().length;
      const badge = document.getElementById('badge-reservas');
      if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    function renderReservations() {
      const listContainer = document.getElementById('reservations-list');
      const items = getStoredReservations();

      if (items.length === 0) {
        listContainer.innerHTML = `
          <div class="bg-white rounded-2xl p-12 text-center border border-pink-100 shadow-sm space-y-3">
            <div class="w-16 h-16 rounded-full bg-pink-50 text-pink-400 flex items-center justify-center mx-auto text-2xl">
              <i class="fa-regular fa-calendar-xmark"></i>
            </div>
            <h4 class="font-bold text-gray-700 text-base">Nenhum agendamento encontrado</h4>
            <p class="text-xs text-gray-400 max-w-sm mx-auto">Você ainda não realizou nenhum agendamento neste navegador. Que tal reservar seu momento de rainha agora?</p>
            <button onclick="switchTab('agendar')" class="mt-2 px-5 py-2.5 gradient-btn text-white text-xs font-bold rounded-xl shadow-md">
              Agendar Procedimento
            </button>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = items.map(item => `
        <div class="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl shrink-0">
              <i class="fa-solid fa-crown"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold uppercase tracking-wider bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">${item.id}</span>
                <span class="text-xs text-gray-400">• ${new Date(item.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <h4 class="font-bold text-gray-800 text-base mt-1">${item.serviceName}</h4>
              <p class="text-xs text-gray-500">Com: <span class="font-medium text-purple-700">${item.professional}</span> | Cliente: ${item.clientName}</p>
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-600 font-medium">
                <span><i class="fa-regular fa-calendar text-pink-500 mr-1"></i> ${item.date}</span>
                <span><i class="fa-regular fa-clock text-purple-500 mr-1"></i> ${item.time}</span>
                <span class="text-emerald-600 font-bold">R$ ${item.servicePrice.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 self-end md:self-center w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-pink-50">
            <button onclick="removeReservation('${item.id}')" class="px-3 py-2 text-gray-400 hover:text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors">
              <i class="fa-solid fa-trash-can mr-1"></i> Cancelar
            </button>
          </div>
        </div>
      `).join('');
    }

    // FEEDBACK TOAST LEVE
    function showToast(msg) {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-5 right-5 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl text-xs font-medium shadow-2xl flex items-center gap-2 border border-pink-400/30 animate-pulse';
      toast.innerHTML = `<i class="fa-solid fa-circle-exclamation text-pink-400"></i> ${msg}`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3200);
    }
