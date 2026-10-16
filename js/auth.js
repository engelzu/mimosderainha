/* Splash, login (e-mail/senha local + Google) e sessão da cliente */
(function () {
  const USERS_KEY = 'mimos_users';
  const SESSION_KEY = 'mimos_session';
  const $ = (id) => document.getElementById(id);
  let mode = 'login'; // 'login' | 'register'

  /* ---------- Utilidades ---------- */
  async function hash(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return btoa(unescape(encodeURIComponent(text)));
    }
  }
  const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch (e) { return []; } };
  const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; } };

  function setError(msg) {
    const el = $('auth-error');
    el.textContent = msg || '';
    el.classList.toggle('hidden', !msg);
  }

  /* ---------- Splash ---------- */
  function hideSplash(then) {
    const s = $('splash');
    s.classList.add('splash-hide');
    setTimeout(() => { s.remove(); if (then) then(); }, 650);
  }

  /* ---------- Sessão ---------- */
  function applySession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    $('auth-screen').classList.add('auth-hide');
    document.body.classList.remove('overflow-hidden');

    const chip = $('user-chip');
    const first = (user.name || 'Visitante').split(' ')[0];
    $('user-chip-name').textContent = first;
    const img = $('user-chip-avatar');
    if (user.picture) { img.src = user.picture; img.classList.remove('hidden'); $('user-chip-icon').classList.add('hidden'); }
    else { img.classList.add('hidden'); $('user-chip-icon').classList.remove('hidden'); }
    chip.classList.remove('hidden');
    prefillClient();
    if (typeof showToast === 'function' && user.provider !== 'restore') showToast(`Bem-vinda, ${first}! 👑`);
  }

  function prefillClient() {
    const s = getSession();
    const name = $('client-name');
    if (s && name && !name.value && s.provider !== 'guest') name.value = s.name || '';
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
    location.reload();
  }

  /* ---------- Formulário e-mail/senha ---------- */
  function setMode(m) {
    mode = m;
    const reg = m === 'register';
    $('tab-login').className = 'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ' + (!reg ? 'bg-white text-purple-700 shadow' : 'text-gray-500');
    $('tab-register').className = 'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ' + (reg ? 'bg-white text-purple-700 shadow' : 'text-gray-500');
    $('field-name').classList.toggle('hidden', !reg);
    $('auth-name').required = reg;
    $('auth-submit-label').textContent = reg ? 'Criar minha conta' : 'Entrar';
    $('auth-password').autocomplete = reg ? 'new-password' : 'current-password';
    setError('');
    $('link-forgot').classList.toggle('hidden', reg);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const email = $('auth-email').value.trim().toLowerCase();
    const pass = $('auth-password').value;
    const users = getUsers();
    if (pass.length < 4) return setError('A senha deve ter pelo menos 4 caracteres.');

    if (mode === 'register') {
      const name = $('auth-name').value.trim();
      if (!name) return setError('Informe seu nome.');
      if (users.some((u) => u.email === email)) return setError('Este e-mail já está cadastrado. Faça login.');
      users.push({ name, email, passHash: await hash(pass) });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      applySession({ name, email, provider: 'local' });
    } else {
      const user = users.find((u) => u.email === email);
      if (!user) return setError('Conta não encontrada. Toque em "Criar conta".');
      if (user.passHash !== await hash(pass)) return setError('Senha incorreta.');
      applySession({ name: user.name, email, provider: 'local' });
    }
  }

  /* ---------- Google ---------- */
  function decodeJwt(token) {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(payload))));
  }

  function onGoogleCredential(resp) {
    try {
      const p = decodeJwt(resp.credential);
      applySession({ name: p.name, email: p.email, picture: p.picture, provider: 'google' });
    } catch (e) {
      setError('Não foi possível entrar com o Google. Tente novamente.');
    }
  }

  function setupGoogle() {
    const clientId = (window.MIMOS_CONFIG || {}).GOOGLE_CLIENT_ID;
    const wrap = $('google-btn-wrap');
    const fallback = $('google-btn-fallback');

    if (!clientId) {
      fallback.addEventListener('click', () => setError('Login com Google ainda não configurado. Informe o Client ID em js/config.js.'));
      return;
    }

    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => {
      google.accounts.id.initialize({ client_id: clientId, callback: onGoogleCredential, ux_mode: 'popup' });
      fallback.classList.add('hidden');
      wrap.classList.remove('hidden');
      google.accounts.id.renderButton(wrap, {
        theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', locale: 'pt-BR',
        width: Math.min(wrap.parentElement.clientWidth || 320, 400)
      });
    };
    s.onerror = () => setError('Sem conexão com o Google. Verifique sua internet.');
    document.head.appendChild(s);
  }

  /* ---------- Recuperação de senha ---------- */
  const RESET_KEY = 'mimos_reset';
  const CODE_TTL = 15 * 60 * 1000; // 15 minutos
  let recoverEmail = '';

  function recoverMsg(text, ok) {
    const el = $('recover-msg');
    el.textContent = text || '';
    el.className = 'text-xs font-semibold text-center ' + (text ? '' : 'hidden ') + (ok ? 'text-emerald-600' : 'text-red-500');
  }

  function openRecover() {
    $('auth-main').classList.add('hidden');
    $('recover-box').classList.remove('hidden');
    $('recover-form-1').classList.remove('hidden');
    $('recover-form-2').classList.add('hidden');
    $('recover-desc').textContent = 'Informe seu e-mail e enviaremos um código de recuperação.';
    $('recover-email').value = $('auth-email').value.trim();
    recoverMsg('');
  }

  function closeRecover() {
    $('recover-box').classList.add('hidden');
    $('auth-main').classList.remove('hidden');
    setMode('login');
  }

  async function sendResetEmail(user, code) {
    const c = window.MIMOS_CONFIG || {};
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: c.EMAILJS_SERVICE_ID,
        template_id: c.EMAILJS_TEMPLATE_ID,
        user_id: c.EMAILJS_PUBLIC_KEY,
        template_params: { to_name: user.name, to_email: user.email, code, store_name: 'Mimos de Rainha' }
      })
    });
    if (!res.ok) throw new Error(await res.text());
  }

  async function onRecoverSend(e) {
    e.preventDefault();
    const email = $('recover-email').value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return recoverMsg('Informe um e-mail válido.');

    const c = window.MIMOS_CONFIG || {};
    if (!c.EMAILJS_SERVICE_ID || !c.EMAILJS_TEMPLATE_ID || !c.EMAILJS_PUBLIC_KEY) {
      return recoverMsg('Envio de e-mail ainda não configurado. Preencha os dados do EmailJS em js/config.js.');
    }

    const btn = $('recover-send');
    btn.disabled = true;
    btn.classList.add('opacity-60');
    const user = getUsers().find((u) => u.email === email);

    try {
      if (user) {
        const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
        await sendResetEmail(user, code);
        localStorage.setItem(RESET_KEY, JSON.stringify({ email, codeHash: await hash(code), exp: Date.now() + CODE_TTL, tries: 0 }));
      }
      // Resposta igual exista ou não a conta (não revela quais e-mails estão cadastrados)
      recoverEmail = email;
      $('recover-form-1').classList.add('hidden');
      $('recover-form-2').classList.remove('hidden');
      $('recover-desc').textContent = `Se ${email} estiver cadastrado, enviamos um código de 6 dígitos (válido por 15 min). Verifique também o spam.`;
      recoverMsg('');
      $('recover-code').focus();
    } catch (err) {
      console.error(err);
      recoverMsg('Não foi possível enviar o e-mail agora. Tente novamente em instantes.');
    } finally {
      btn.disabled = false;
      btn.classList.remove('opacity-60');
    }
  }

  async function onRecoverReset(e) {
    e.preventDefault();
    const code = $('recover-code').value.trim();
    const newPass = $('recover-newpass').value;
    if (!/^\d{6}$/.test(code)) return recoverMsg('Digite o código de 6 dígitos.');
    if (newPass.length < 4) return recoverMsg('A nova senha deve ter pelo menos 4 caracteres.');

    let reset;
    try { reset = JSON.parse(localStorage.getItem(RESET_KEY)); } catch (err) { reset = null; }
    if (!reset || reset.email !== recoverEmail || Date.now() > reset.exp) {
      return recoverMsg('Código inválido ou expirado. Solicite um novo.');
    }
    if (reset.tries >= 5) {
      localStorage.removeItem(RESET_KEY);
      return recoverMsg('Muitas tentativas. Solicite um novo código.');
    }
    if (reset.codeHash !== await hash(code)) {
      reset.tries += 1;
      localStorage.setItem(RESET_KEY, JSON.stringify(reset));
      return recoverMsg('Código incorreto.');
    }

    const users = getUsers();
    const user = users.find((u) => u.email === recoverEmail);
    if (!user) return recoverMsg('Conta não encontrada.');
    user.passHash = await hash(newPass);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.removeItem(RESET_KEY);

    recoverMsg('Senha redefinida com sucesso! Entrando...', true);
    setTimeout(() => { closeRecover(); applySession({ name: user.name, email: user.email, provider: 'local' }); }, 900);
  }

  /* ---------- Visitante ---------- */
  function guest() {
    applySession({ name: 'Visitante', provider: 'guest' });
  }

  /* ---------- Preenche o nome no passo final ---------- */
  const originalGoToStep = window.goToStep;
  if (typeof originalGoToStep === 'function') {
    window.goToStep = function (step) {
      originalGoToStep(step);
      if (step === 4) prefillClient();
    };
  }

  /* ---------- Init ---------- */
  setMode('login');
  setupGoogle();
  $('tab-login').addEventListener('click', () => setMode('login'));
  $('tab-register').addEventListener('click', () => setMode('register'));
  $('auth-form').addEventListener('submit', onSubmit);
  $('link-forgot').addEventListener('click', openRecover);
  $('recover-back').addEventListener('click', closeRecover);
  $('recover-form-1').addEventListener('submit', onRecoverSend);
  $('recover-form-2').addEventListener('submit', onRecoverReset);
  $('btn-guest').addEventListener('click', guest);
  $('user-chip').addEventListener('click', () => { if (confirm('Deseja sair da sua conta?')) logout(); });
  $('toggle-pass').addEventListener('click', () => {
    const i = $('auth-password');
    i.type = i.type === 'password' ? 'text' : 'password';
    $('toggle-pass').firstElementChild.className = i.type === 'password' ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
  });

  const session = getSession();
  document.body.classList.add('overflow-hidden');
  if (session) {
    $('auth-screen').classList.add('auth-hide');
    // Já logada: splash curta e entra direto
    setTimeout(() => hideSplash(() => applySession({ ...session, provider: 'restore' })), 1400);
  } else {
    setTimeout(() => hideSplash(), 2900);
  }
})();
