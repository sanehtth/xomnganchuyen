// js/he-thong/firebase.js
// Khoi tao Firebase + Firestore + Realtime Database
// Chi lam nhiem vu he thong, khong viet logic giao dien o day

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// ===== Auth =====
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ===== Firestore =====
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
  serverTimestamp, // Firestore timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== Realtime Database =====
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
  onValue,
  off,
  serverTimestamp as rtdbServerTimestamp, // RTDB timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Cau hinh Firebase
// TODO: neu sau nay ban doi project Firebase thi chi can doi doan nay
const firebaseConfig = {
  apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  // Quan trong: RTDB cua project dang o khu vuc asia-southeast1
  databaseURL: "https://xomnganchuyen-default-rtdb.asia-southeast1.firebasedatabase.app",
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

  // realtime db
  rtdb,
  ref,
  get,
  set,
  update,
  push,
  onValue,
  off,
  rtdbServerTimestamp,
};
