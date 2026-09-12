import { Alert } from "react-native";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../config/firebase";

// Gleiches Soft-Load-Muster wie incidentReportPdf.js: expo-print/expo-sharing
// stecken erst ab dem naechsten nativen Build in den ausgelieferten Apps.
let Print = null;
let Sharing = null;
try {
  Print = require("expo-print");
} catch (e) {
  Print = null;
}
try {
  Sharing = require("expo-sharing");
} catch (e) {
  Sharing = null;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : null;
  if (!date) return "-";
  return date.toLocaleDateString("de-DE") + ", " + date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatNow() {
  const now = new Date();
  return now.toLocaleDateString("de-DE") + ", " + now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

async function collectExportData(uid) {
  const [postsSnap, scoreSnap, friendsSnap, savedSnap] = await Promise.all([
    getDocs(query(collection(db, "posts"))).then((snap) =>
      snap.docs.filter((d) => d.data().authorId === uid).map((d) => d.data())
    ),
    getDocs(query(collection(db, "users", uid, "scoreEvents"), orderBy("createdAt", "desc"))),
    getDocs(query(collection(db, "users", uid, "friends"))),
    getDocs(query(collection(db, "users", uid, "savedPosts"))),
  ]);
  return {
    posts: postsSnap,
    scoreEvents: scoreSnap.docs.map((d) => d.data()),
    friendsCount: friendsSnap.size,
    savedPostsCount: savedSnap.size,
  };
}

// Erstellt eine lesbare Zusammenfassung der eigenen Daten (Profil, Beiträge,
// Punkte-Historie, Kennzahlen) als PDF und oeffnet den System-Teilen-Dialog -
// die naeherungsweise Umsetzung von "Eigene Daten herunterladen" ohne
// eigenes Backend. Fuer eine vollstaendige, maschinenlesbare Rohkopie kann
// jederzeit zusaetzlich ein Support-Ticket an den Gruender gestellt werden.
export async function generateDataExportPdf(user) {
  if (!Print || !Sharing) {
    Alert.alert(
      "Update nötig",
      "Der Datenexport braucht die neueste App-Version. Bitte aktualisiere Nata und versuch es erneut."
    );
    return;
  }

  let data;
  try {
    data = await collectExportData(user.uid);
  } catch (e) {
    Alert.alert("Fehler", "Deine Daten konnten gerade nicht geladen werden. Bitte versuch es erneut.");
    return;
  }

  const totalPoints = data.scoreEvents.reduce((sum, e) => sum + (e.amount || 0), 0);

  const postsRows = data.posts.length
    ? data.posts
        .map(
          (p) => `
        <tr>
          <td>${escapeHtml(formatDate(p.createdAt))}</td>
          <td>${escapeHtml(p.text || "")}</td>
          <td>${p.likeCount || 0}</td>
        </tr>`
        )
        .join("")
    : `<tr><td colspan="3">Keine Beiträge.</td></tr>`;

  const scoreRows = data.scoreEvents.length
    ? data.scoreEvents
        .slice(0, 100)
        .map((e) => `<tr><td>${escapeHtml(formatDate(e.createdAt))}</td><td>${escapeHtml(e.reason || "")}</td><td>+${e.amount || 0}</td></tr>`)
        .join("")
    : `<tr><td colspan="3">Keine Punkte-Ereignisse.</td></tr>`;

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 32px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 14px; margin-top: 28px; margin-bottom: 8px; }
          .meta { color: #555; font-size: 12px; margin-bottom: 24px; }
          .stats { display: flex; gap: 20px; margin-bottom: 8px; }
          .stat { font-size: 12px; color: #333; }
          .stat b { display: block; font-size: 18px; color: #111; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
          th { color: #777; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
          .disclaimer { margin-top: 32px; padding: 16px; background: #f4f4f4; border-radius: 8px; font-size: 11px; line-height: 1.6; color: #333; }
        </style>
      </head>
      <body>
        <h1>Meine Daten - Nata</h1>
        <div class="meta">Exportiert am ${escapeHtml(formatNow())} für @${escapeHtml(user.username || "")}</div>

        <div class="stats">
          <div class="stat"><b>${escapeHtml(user.displayName || "")}</b>Name</div>
          <div class="stat"><b>${totalPoints}</b>Punkte (Historie)</div>
          <div class="stat"><b>${data.friendsCount}</b>Connections</div>
          <div class="stat"><b>${data.posts.length}</b>Beiträge</div>
          <div class="stat"><b>${data.savedPostsCount}</b>Gespeichert</div>
        </div>

        <h2>Profil</h2>
        <table>
          <tr><td>E-Mail</td><td>${escapeHtml(user.email || "-")}</td></tr>
          <tr><td>Nutzername</td><td>@${escapeHtml(user.username || "-")}</td></tr>
          <tr><td>Bio</td><td>${escapeHtml(user.bio || "-")}</td></tr>
          <tr><td>Verifiziert</td><td>${user.verified ? "Ja" : "Nein"}</td></tr>
          <tr><td>Konto erstellt</td><td>${escapeHtml(formatDate(user.createdAt))}</td></tr>
        </table>

        <h2>Beiträge (${data.posts.length})</h2>
        <table>
          <tr><th>Datum</th><th>Text</th><th>Reaktionen</th></tr>
          ${postsRows}
        </table>

        <h2>Punkte-Historie (letzte 100)</h2>
        <table>
          <tr><th>Datum</th><th>Grund</th><th>Punkte</th></tr>
          ${scoreRows}
        </table>

        <div class="disclaimer">
          Diese Zusammenfassung enthält deine wichtigsten Daten bei Nata (Profil, Beiträge, Punkte-Historie).
          Nachrichten sind aus technischen Gründen (verschlüsselte 1:1-Zuordnung) hier nicht enthalten - für
          eine vollständige Rohkopie aller Daten wende dich über ein Support-Ticket an den Gründer.
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
    } else {
      Alert.alert("Export erstellt", "Die Datei wurde erstellt, kann auf diesem Gerät aber nicht geteilt werden.");
    }
  } catch (e) {
    Alert.alert("Fehler", "Der Export konnte nicht erstellt werden. Bitte erneut versuchen.");
  }
}
