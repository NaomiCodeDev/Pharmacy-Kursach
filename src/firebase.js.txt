// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVnCP1clZB6ZDOgiBUE6eFlKDtrQ1vsmc",
  authDomain: "pharmacy-pharmacist.firebaseapp.com",
  projectId: "pharmacy-pharmacist",
  storageBucket: "pharmacy-pharmacist.firebasestorage.app",
  messagingSenderId: "244040468291",
  appId: "1:244040468291:web:2821c61cd509148f7ad1f6",
  measurementId: "G-B3NG8P9HXV"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
// Инициализация Firestore
const db = getFirestore(app);

export { db };
