# SnapClone

Eine Snapchat-ähnliche Mobile App, gebaut mit **React Native (Expo)** und **Firebase**
(Authentication, Firestore, Storage).

## Funktionen

- **E-Mail/Passwort-Login** und Registrierung mit eindeutigem Benutzernamen
- **Kamera**: Tippen für Foto, Halten für Video (max. 15s), Kamera wechseln, Blitz an/aus
- **Snaps senden**: Empfänger auswählen, Anzeigedauer (1–10s) festlegen; der Snap wird
  nach dem Ansehen automatisch aus der Datenbank gelöscht (verschwindet wie im Original)
- **Storys**: 24 Stunden sichtbare Fotos/Videos, die alle Freunde ansehen können,
  inklusive Fortschrittsbalken-Viewer
- **Chat**: Echtzeit-1:1-Nachrichten pro Freundespaar
- **Freunde**: Nutzer per Benutzername suchen, Freundschaftsanfragen senden/annehmen/ablehnen
- **Profil**: Anzeigename, Avatar, Snap-Score, Abmelden

## Projektstruktur

```
snap-clone/
  App.js                     Einstiegspunkt (Provider + Navigation)
  app.json                   Expo-Konfiguration (Berechtigungen, Plugins)
  src/
    config/firebase.js       Firebase-Initialisierung
    context/AuthContext.js   Auth-State + Firestore-Nutzerprofil
    navigation/               Root-, Auth- und Tab-Navigatoren
    screens/                  Alle App-Bildschirme
    screens/auth/              Login & Registrierung
    services/                  Firestore/Storage-Zugriffe (snaps, storys, chats, friends, users)
    components/                Wiederverwendbare UI-Teile (StoryCircle, ChatListItem)
    theme/colors.js            Zentrale Farbpalette
  firestore.rules             Sicherheitsregeln für Firestore
  storage.rules                Sicherheitsregeln für Storage
```

## Einrichtung

### 1. Voraussetzungen

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo` reicht, keine
  globale Installation nötig)
- Die **Expo Go**-App auf deinem Handy (oder ein Android/iOS-Simulator)

### 2. Abhängigkeiten installieren

```bash
cd snap-clone
npm install
```

### 3. Firebase-Projekt anlegen

1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com) und erstelle
   ein neues Projekt.
2. Aktiviere **Authentication → Sign-in-Methode → E-Mail/Passwort**.
3. Aktiviere **Firestore Database** (im Produktionsmodus starten).
4. Aktiviere **Storage**.
5. Füge unter *Projekteinstellungen → Meine Apps* eine **Web-App** hinzu, um die
   Konfigurationswerte zu erhalten.
6. Trage die Werte in `src/config/firebase.js` ein (siehe `.env.example` für die Feldnamen).

### 4. Sicherheitsregeln veröffentlichen

Mit der [Firebase CLI](https://firebase.google.com/docs/cli):

```bash
npm install -g firebase-tools
firebase login
firebase init firestore storage   # bestehendes Projekt auswählen
firebase deploy --only firestore:rules,storage:rules
```

Alternativ kannst du den Inhalt von `firestore.rules` und `storage.rules` direkt in der
Firebase-Console unter *Firestore → Regeln* bzw. *Storage → Regeln* einfügen.

> Firestore fragt beim ersten Ausführen der App eventuell nach einem **zusammengesetzten
> Index** (z. B. für die Snap- oder Story-Abfragen). Klicke einfach auf den Link, den die
> Konsole in der Fehlermeldung anzeigt — Firebase legt den Index dann automatisch an.

### 5. App starten

```bash
npx expo start
```

Scanne den QR-Code mit der Expo-Go-App (Android) bzw. der Kamera-App (iOS), oder drücke
`a` / `i` für einen Emulator/Simulator.

## Datenmodell (Firestore)

| Collection | Beschreibung |
|---|---|
| `users/{uid}` | Profil: `username`, `displayName`, `avatarColor`, `snapScore` |
| `users/{uid}/friends/{friendUid}` | Freundesliste (beidseitig gepflegt) |
| `users/{uid}/stories/{storyId}` | 24h-Storys mit `mediaUrl`, `viewers[]` |
| `friendRequests/{id}` | Offene/angenommene/abgelehnte Freundschaftsanfragen |
| `snaps/{id}` | Einzelner Snap pro Empfänger, wird nach dem Ansehen gelöscht |
| `chats/{chatId}` + `.../messages/{id}` | 1:1-Chatverläufe |

## Bekannte Einschränkungen / nächste Schritte

- Snaps und Storys werden aktuell **nicht clientseitig komprimiert** — für den produktiven
  Einsatz lohnt sich `expo-image-manipulator` bzw. Video-Kompression vor dem Upload.
- Push-Benachrichtigungen sind nicht enthalten (siehe `expo-notifications`, falls gewünscht).
- Es gibt keine automatische Bereinigung abgelaufener Storys/Snaps auf Serverseite — dafür
  eignet sich eine **Firebase Cloud Function** mit einem geplanten Trigger.
- Text-/Sticker-Overlays auf Snaps (Zeichnen, Emojis) sind noch nicht implementiert.
