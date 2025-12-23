// js/he-thong/firebase.js
// Khoi tao Firebase + Auth + Firestore + Realtime Database
// Chi lam nhiem vu he thong, khong viet logic giao dien o day

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  serverTimestamp as rtdbServerTimestamp,
  onValue as rtdbOnValue,
  push as rtdbPush,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Cau hinh Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559a",
  measurementId: "G-2IJSZS61EX",
};

// Khoi tao
const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firestore
const db = getFirestore(app);

// Realtime Database
// Luu y: neu ban co RTDB URL rieng (multi-region), co the truyen them tham so thu 2 cho getDatabase(app, "<RTDB_URL>")
const rtdb = getDatabase(app);

// Export dung cho cac file khac
export {
  // core
  app,

  // auth
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

  // realtime database (RTDB)
  rtdb,
  getDatabase,
  rtdbRef,
  rtdbGet,
  rtdbSet,
  rtdbUpdate,
  rtdbServerTimestamp,
  rtdbOnValue,
  rtdbPush,
};
