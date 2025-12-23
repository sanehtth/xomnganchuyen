// public/js/he-thong/firebase.js
// Firebase init (Auth + Firestore + Realtime Database)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getDatabase,
  ref as rtdbRef,
  get as rtdbGet,
  set as rtdbSet,
  update as rtdbUpdate,
  onValue as rtdbOnValue,
  runTransaction as rtdbRunTransaction,
  serverTimestamp as rtdbServerTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// NOTE: Bạn chỉ cần đổi firebaseConfig khi đổi project Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:80de062fae1fcb3c99559a",
  measurementId: "G-21JSZ5G1EX",
  // Quan trọng: chỉ rõ databaseURL để tránh cảnh báo region / host
  databaseURL: "https://xomnganchuyen-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firestore
const db = getFirestore(app);

// Realtime Database
const rtdb = getDatabase(app, firebaseConfig.databaseURL);

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
  orderBy,
  serverTimestamp,

  // realtime db
  rtdb,
  getDatabase,
  rtdbRef,
  rtdbGet,
  rtdbSet,
  rtdbUpdate,
  rtdbOnValue,
  rtdbRunTransaction,
  rtdbServerTimestamp,
};
