// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCibuFclmHoonkZqVOT3vOXmHHUfsK8hbo",
  authDomain: "posttop-7155a.firebaseapp.com",
  projectId: "posttop-7155a",
  storageBucket: "posttop-7155a.firebasestorage.app",
  messagingSenderId: "975294540512",
  appId: "1:975294540512:web:9f4bf8e26b26e6e8e47e85"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Firebase UID is the identity used by Firestore rules; display names are cosmetic.
async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export { db, serverTimestamp, storage, auth, ensureAuth };
