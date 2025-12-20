import { db } from "../firebase";
import { ref, update, get } from "firebase/database";

export async function adminApproveUser(uid) {
  const userRef = ref(db, `users/${uid}`);
  await update(userRef, {
    role: "member",
    status: "approved",
  });
}

export async function adminRejectUser(uid) {
  const userRef = ref(db, `users/${uid}`);
  await update(userRef, {
    status: "none",
  });
}

export async function giveJoinCode(uid, joinCode) {
  const userRef = ref(db, `users/${uid}`);
  await update(userRef, { joinCode });
}

export async function getUser(uid) {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.val();
}
