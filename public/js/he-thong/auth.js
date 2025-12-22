// he-thong/auth.js
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, signOut } 
from "./firebase.js";

let authState = null;

export function subscribeAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        authState = user;
        callback(user);
    });
}

export function getAuthState() {
    return authState;
}

export async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
}

export async function logoutAccount() {
    await signOut(auth);
    window.location.href = "/index.html";
}

export { authState };
