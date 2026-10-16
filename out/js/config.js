/* Configuração do login com Google.
   1) Acesse https://console.cloud.google.com/apis/credentials
   2) Crie um "ID do cliente OAuth" do tipo "Aplicativo da Web"
   3) Em "Origens JavaScript autorizadas" adicione: http://localhost:8080 (e o domínio final do site)
   4) Cole o Client ID abaixo. */
window.MIMOS_CONFIG = {
  GOOGLE_CLIENT_ID: '',   // ex: '1234567890-abc123.apps.googleusercontent.com'

  /* Envio de e-mail de recuperação de senha (EmailJS - gratuito):
     1) Crie conta em https://www.emailjs.com e adicione um "Email Service" (Gmail, Outlook...)
     2) Crie um "Email Template" com Assunto e corpo usando as variáveis:
          {{to_name}}, {{to_email}}, {{code}}, {{store_name}}
        e no campo "To Email" do template coloque {{to_email}}
     3) Copie Service ID, Template ID e Public Key (Account > API Keys) abaixo. */
  EMAILJS_SERVICE_ID: '',
  EMAILJS_TEMPLATE_ID: '',
  EMAILJS_PUBLIC_KEY: '',

  /* Firebase (agenda online compartilhada entre todas as clientes) */
  FIREBASE: {
    apiKey: "AIzaSyCPsVp4vsXu4r0noBG3dPbetHv_KYFeTEY",
    authDomain: "mimosderainha.firebaseapp.com",
    projectId: "mimosderainha",
    storageBucket: "mimosderainha.firebasestorage.app",
    messagingSenderId: "991475852154",
    appId: "1:991475852154:web:410fda5b4f47335da7ecc3"
  },
  /* Usuário criado em Firebase > Authentication (e-mail/senha). A senha é a mesma do painel admin. */
  FIREBASE_ADMIN_EMAIL: 'admin@mimosderainha.com'
};
