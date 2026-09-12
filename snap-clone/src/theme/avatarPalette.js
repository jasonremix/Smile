// Gemeinsame Avatar-Farbpalette - beim Signup wird eine zufaellig
// zugewiesen, in EditProfileScreen kann man daraus spaeter frei waehlen.
export const AVATAR_PALETTE = ["#A855F7", "#7C3AED", "#C084FC", "#F472B6", "#38BDF8", "#34D399"];

export function randomAvatarColor() {
  return AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
}

// Deterministischer Fallback fuer Stellen, an denen kein avatarColor
// gespeichert ist (z.B. Discover-Vorschlaege) - immer dieselbe Farbe fuer
// dieselbe Person statt eines einzigen, immer gleichen Kreises fuer alle.
export function avatarColorForUid(uid) {
  if (!uid) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

export default AVATAR_PALETTE;
