// Festes, oeffentlich kommuniziertes Enddatum der Beta - Ende des Tages
// (23:59:59 lokale Zeit), damit der 24.09.2026 selbst noch vollstaendig
// zaehlt. Muss man aendern, falls sich das Enddatum je verschiebt - bewusst
// keine Fernkonfiguration ueber Firestore, um kein neues Missbrauchsziel
// (jeder Client koennte sonst ein falsches Enddatum vorspiegeln) zu schaffen.
export const BETA_END_DATE = new Date(2026, 8, 24, 23, 59, 59);

export function getBetaCountdown(now = new Date()) {
  const remainingMs = BETA_END_DATE.getTime() - now.getTime();
  if (remainingMs <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0 };
  }
  const days = Math.floor(remainingMs / 86400000);
  const hours = Math.floor((remainingMs % 86400000) / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);
  return { expired: false, days, hours, minutes };
}
