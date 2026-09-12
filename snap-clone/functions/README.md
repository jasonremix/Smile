# Nata Cloud Functions - Push-Versand

Sendet echte Push-Benachrichtigungen (auch wenn die App im Hintergrund oder
geschlossen ist) fuer: Likes, Kommentare, Verbindungsanfragen/-akzeptierungen,
1:1-Nachrichten, Gruppen-Nachrichten und Gruender-Ankuendigungen.

## Voraussetzungen zum Deployen

1. **Blaze-Plan (Pay as you go)** muss fuer das Firebase-Projekt aktiv sein -
   Cloud Functions laesst sich nicht auf dem kostenlosen Spark-Plan
   ausfuehren.
2. **Cloud Functions API** muss im Projekt aktiviert sein (passiert beim
   ersten Deploy meist automatisch, falls Blaze aktiv ist).
3. Dieser Code kann **nicht** vom Claude-Service-Konto aus deployt werden -
   das Konto hat bewusst nur eingeschraenkte Rechte (Firestore-Regeln +
   Firestore-Daten), keine projektweiten Admin-Rechte fuer Cloud
   Functions/Cloud Build. Das Deployen muss von einem Account mit
   Owner/Editor-Rechten auf das Firebase-Projekt aus passieren (z.B. deinem
   eigenen).

## Deployen

```bash
npm install -g firebase-tools   # falls noch nicht vorhanden
firebase login
cd snap-clone
firebase deploy --only functions
```

Kein weiteres Setup noetig - die Funktionen nutzen ausschliesslich Firestore
(ueber das Admin SDK, das automatisch mit den Projekt-Anmeldedaten
authentifiziert) und Expos oeffentliche Push-API (kein zusaetzlicher
API-Key noetig).

## Wie es funktioniert

Jede Funktion reagiert auf neu angelegte Firestore-Dokumente (kein Polling,
keine geplanten Jobs) und schickt dann ueber `https://exp.host/--/api/v2/push/send`
eine Push-Nachricht an alle registrierten Geraete-Tokens der Zielperson(en).
Die Tokens werden client-seitig beim Login in `users/{uid}/pushTokens/`
gespeichert (siehe `src/utils/pushNotifications.js`).

Schlaegt ein Versand fehl (z.B. ein abgelaufener Token), wird das nur
geloggt - die eigentliche Aktion (Like, Nachricht, ...) ist zu diesem
Zeitpunkt in Firestore laengst erfolgreich gespeichert und darf davon nicht
beeintraechtigt werden.
