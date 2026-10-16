/* Carrega serviços e profissionais salvos pelo painel Admin (localStorage).
   Substitui o conteúdo dos arrays padrão de data.js sem alterar a lógica do app. */
(function () {
  const KEYS = { services: 'mimos_services', professionals: 'mimos_professionals', whatsapp: 'mimos_whatsapp' };

  function load(key, target) {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(saved)) target.splice(0, target.length, ...saved);
    } catch (e) {
      console.error('Erro ao carregar ' + key, e);
    }
  }

  load(KEYS.services, SERVICES);
  load(KEYS.professionals, PROFESSIONALS);

  const savedWhats = localStorage.getItem(KEYS.whatsapp);
  if (savedWhats && /^\d{10,15}$/.test(savedWhats)) SALON_WHATSAPP = savedWhats;

  window.MIMOS_KEYS = KEYS;
})();
