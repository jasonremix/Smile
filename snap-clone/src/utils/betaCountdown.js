// Festes, oeffentlich kommuniziertes Enddatum der Beta. Urspruenglich auf
// den 24.09.2026 angesetzt, dann vorzeitig beendet (siehe announcements-
// Eintrag "Beta beendet") - hier auf den tatsaechlichen Beendigungstag
// vorgezogen, damit die Pille ("Noch X Tage Beta") nicht weiter einen
// laengst ueberholten Countdown zeigt und der Ankuendigung widerspricht.
// Bewusst keine Fernkonfiguration ueber Firestore, um kein neues
// Missbrauchsziel (jeder Client koennte sonst ein falsches Enddatum
// vorspiegeln) zu schaffen.
export const BETA_END_DATE = new Date(2026, 7, 21, 0, 0, 0);

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
