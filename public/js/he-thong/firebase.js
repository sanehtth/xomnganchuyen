// js/he-thong/firebase.js
// Khoi tao Firebase + Firestore + Realtime Database

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// Auth
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firestore
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Realtime Database
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
  onValue,
  serverTimestamp as rtdbServerTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Cau hinh Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YspZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559d",
  measurementId: "G-21JSZ5G1EX",
};

// Khoi tao
const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firestore
const db = getFirestore(app);

// Realtime DB
const rtdb = getDatabase(app);

// Alias de tranh nham ten bien
const realtimeDb = rtdb;

export {
  // core
  app,

  // auth
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,

  // firestore
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,

  // realtime database
  rtdb,
  realtimeDb,
  ref,
  get,
  set,
  update,
  push,
  onValue,
  rtdbServerTimestamp,
};
