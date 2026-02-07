// firebase.js
// Put this file at the web root and import it from other modules with:
// import { db, serverTimestamp } from './firebase.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import {
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// --- PASTE your firebaseConfig here (from Firebase console) ---
const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
// ------------------------------------------------------------

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exports
export { db, serverTimestamp };
