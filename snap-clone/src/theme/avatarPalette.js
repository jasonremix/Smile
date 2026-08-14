// Gemeinsame Avatar-Farbpalette - beim Signup wird eine zufaellig
// zugewiesen, in EditProfileScreen kann man daraus spaeter frei waehlen.
export const AVATAR_PALETTE = ["#A855F7", "#7C3AED", "#C084FC", "#F472B6", "#38BDF8", "#34D399"];

export function randomAvatarColor() {
  return AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
}

export default AVATAR_PALETTE;
