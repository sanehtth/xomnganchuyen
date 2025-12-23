// js/he-thong/firebase.js
// Khoi tao Firebase + Firestore + Realtime Database
// Chi lam nhiem vu he thong, khong viet logic giao dien o day

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
  serverTimestamp, // Firestore serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getDatabase,
  ref,
  push,
  get,
  set,
  update,
  child,
  onValue,
  off,
  serverTimestamp as rtdbServerTimestamp, // RTDB serverTimestamp
  increment,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// =======================
// Cau hinh Firebase (chi doi doan nay neu doi project)
// =======================
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.appspot.com",
  messagingSenderId: "639809447264",
  appId: "1:639809447264:web:7d32f39e4b86c9bd4a6f4c",
  databaseURL: "https://xomnganchuyen-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Firestore
const db = getFirestore(app);

// Realtime Database
const rtdb = getDatabase(app);

// Export nhung gi can cho cac file khac
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

  // rtdb
  rtdb,
  getDatabase,
  ref,
  push,
  get,
  set,
  update,
  child,
  onValue,
  off,
  rtdbServerTimestamp,
  increment,
};
