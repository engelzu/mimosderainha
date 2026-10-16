/* Camada Firebase (Firestore + Auth) - agenda online compartilhada.
   Expõe window.MimosDB. Carregado como módulo ES (sem build). */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, doc, runTransaction, collection, query, where,
  getDocs, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const cfg = window.MIMOS_CONFIG || {};
let api = { enabled: false };

if (cfg.FIREBASE && cfg.FIREBASE.apiKey) {
  const app = initializeApp(cfg.FIREBASE);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const slotId = (date, time, proId) => `${date}_${time.replace(':', '')}_${proId}`;

  api = {
    enabled: true,

    /* Horários ocupados de um dia: [{date, time, proId}] (sem dados pessoais) */
    async busySlots(date) {
      const snap = await getDocs(query(collection(db, 'slots'), where('date', '==', date)));
      return snap.docs.map((d) => d.data());
    },

    /* Reserva atômica. Tenta cada profissional de proIds; falha com SLOT_TAKEN se todas ocupadas.
       Retorna o id da profissional que ficou com o horário. */
    async book({ date, time, proIds, booking }) {
      return runTransaction(db, async (tx) => {
        let chosen = null;
        for (const id of proIds) {
          const snap = await tx.get(doc(db, 'slots', slotId(date, time, id)));
          if (!snap.exists()) { chosen = id; break; }
        }
        if (!chosen) throw new Error('SLOT_TAKEN');
        const sid = slotId(date, time, chosen);
        tx.set(doc(db, 'slots', sid), { date, time, proId: chosen });
        tx.set(doc(db, 'bookings', sid), { ...booking, date, time, proId: chosen, createdAt: serverTimestamp() });
        return chosen;
      });
    },

    /* --- Admin --- */
    async adminLogin(password) {
      await signInWithEmailAndPassword(auth, cfg.FIREBASE_ADMIN_EMAIL, password);
    },
    async adminLogout() { await signOut(auth); },
    async listBookings() {
      const snap = await getDocs(collection(db, 'bookings'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    async cancelBooking(id) {
      await deleteDoc(doc(db, 'slots', id));
      await deleteDoc(doc(db, 'bookings', id));
    }
  };
}

window.MimosDB = api;
window.dispatchEvent(new Event('mimosdb-ready'));
