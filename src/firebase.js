// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: dùng đúng config của dự án bạn
const firebaseConfig = {
   apiKey: "AIzaSyCsy8_u9ELGMiur-YyKsDYu1oU8YSpZKXY",
  authDomain: "xomnganchuyen.firebaseapp.com",
  projectId: "xomnganchuyen",
  storageBucket: "xomnganchuyen.firebasestorage.app",
  messagingSenderId: "335661705640",
  appId: "1:335661705640:web:8bde062fae1fcb3c99559d",
  measurementId: "G-21JSZ5G1EX",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Hàm login / logout dùng chung
export async function loginWithGoogle() {
  await signInWithPopup(auth, googleProvider);
}

export function logout() {
  return signOut(auth);
}
