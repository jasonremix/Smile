// Einfacher modulweiter Zustand statt Context, weil er nur eine Frage
// beantworten muss: "ist der Chat X gerade aktiv sichtbar?" - gebraucht vom
// Banner, damit er nicht fuer den Chat aufploppt, in dem man ohnehin schon ist.
let activeChatId = null;

export function setActiveChatId(chatId) {
  activeChatId = chatId;
}

export function getActiveChatId() {
  return activeChatId;
}
