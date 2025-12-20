import { db } from "../firebase";
import { ref, get, set, update } from "firebase/database";

// random code
function generateJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export async function ensureUserRecord(user, isAdmin) {
  if (!user) return null;

  const now = Date.now();
  const userRef = ref(db, `users/${user.uid}`);
  const snap = await get(userRef);

  if (!snap.exists()) {
    const code = generateJoinCode();
    await set(userRef, {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      status: isAdmin ? "active" : "guest",
      role: isAdmin ? "associate" : "guest",
      joinCode: isAdmin ? "" : code,
      isSubVerified: isAdmin ? true : false,
      lastSubCheckTime: now,
      level: 1,
      xp: 0,
      coin: 0,
      joinedAt: now,
      lastActiveAt: now,
    });

    return { status: "guest", role: "guest", joinCode: code };
  }

  // update last active
  await update(userRef, { lastActiveAt: now });
  return snap.val();
}
