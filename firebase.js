// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import {
  getFirestore,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

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

export { db, serverTimestamp };
