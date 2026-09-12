import { Alert } from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";

// Gleiches Soft-Load-Muster wie incidentReportPdf.js/dataExportPdf.js.
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

async function collectYearRecapData(uid, year) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [allPosts, scoreSnap, friendsSnap, chatsSnap] = await Promise.all([
    getDocs(query(collection(db, "posts"), where("authorId", "==", uid))).then((snap) =>
      snap.docs.map((d) => d.data())
    ),
    getDocs(
      query(
        collection(db, "users", uid, "scoreEvents"),
        where("createdAt", ">=", yearStart),
        where("createdAt", "<", yearEnd)
      )
    ),
    getDocs(query(collection(db, "users", uid, "friends"))),
    getDocs(query(collection(db, "chats"), where("participants", "array-contains", uid))),
  ]);

  const postsThisYear = allPosts.filter((p) => {
    const d = p.createdAt?.toDate ? p.createdAt.toDate() : null;
    return d && d >= yearStart && d < yearEnd;
  });

  const mostReactedPost = postsThisYear.reduce(
    (best, p) => ((p.likeCount || 0) > (best?.likeCount || 0) ? p : best),
    null
  );

  const totalPoints = scoreSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
  const longestStreak = chatsSnap.docs.reduce((max, d) => Math.max(max, d.data().streakCount || 0), 0);

  return {
    postsCount: postsThisYear.length,
    mostReactedPost,
    totalPoints,
    friendsCount: friendsSnap.size,
    longestStreak,
  };
}

// Erstellt einen einseitigen, teilbaren Jahresrueckblick als PDF - aus
// echten, tatsaechlich vorhandenen Daten (keine erfundenen Kennzahlen).
export async function generateYearRecapPdf(user) {
  if (!Print || !Sharing) {
    Alert.alert(
      "Update nötig",
      "Der Jahresrückblick braucht die neueste App-Version. Bitte aktualisiere Nata und versuch es erneut."
    );
    return;
  }

  const year = new Date().getFullYear();
  let data;
  try {
    data = await collectYearRecapData(user.uid, year);
  } catch (e) {
    Alert.alert("Fehler", "Dein Rückblick konnte gerade nicht geladen werden. Bitte versuch es erneut.");
    return;
  }

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; background: #0d0d0d; color: #fff; padding: 40px; }
          .eyebrow { color: #C084FC; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
          h1 { font-size: 32px; margin: 8px 0 4px; }
          .subtitle { color: #8e8e8e; font-size: 13px; margin-bottom: 32px; }
          .grid { display: flex; flex-wrap: wrap; gap: 16px; }
          .stat { width: 45%; background: #1a1a1a; border: 1px solid #2e2e2e; border-radius: 16px; padding: 20px; }
          .stat .value { font-size: 30px; font-weight: 800; color: #C084FC; }
          .stat .label { font-size: 12px; color: #8e8e8e; margin-top: 4px; }
          .quote { margin-top: 24px; padding: 20px; background: #1a1a1a; border-radius: 16px; border: 1px solid #2e2e2e; }
          .quote .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8e8e8e; margin-bottom: 8px; }
          .quote .text { font-size: 15px; line-height: 1.5; font-style: italic; }
          .footer { margin-top: 32px; font-size: 11px; color: #555; text-align: center; }
        </style>
      </head>
      <body>
        <div class="eyebrow">Nata · Jahresrückblick</div>
        <h1>Dein Jahr ${year}</h1>
        <div class="subtitle">@${escapeHtml(user.username || "")}</div>

        <div class="grid">
          <div class="stat"><div class="value">${data.postsCount}</div><div class="label">Beiträge geteilt</div></div>
          <div class="stat"><div class="value">${data.totalPoints}</div><div class="label">Punkte gesammelt</div></div>
          <div class="stat"><div class="value">${data.friendsCount}</div><div class="label">Connections</div></div>
          <div class="stat"><div class="value">${data.longestStreak}</div><div class="label">Längster Streak (Tage)</div></div>
        </div>

        ${
          data.mostReactedPost?.text
            ? `<div class="quote">
                <div class="label">Dein meistbeachteter Beitrag ${year}</div>
                <div class="text">„${escapeHtml(data.mostReactedPost.text)}"</div>
              </div>`
            : ""
        }

        <div class="footer">Erstellt mit Nata - Social. Echt. Verbunden.</div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
    } else {
      Alert.alert("Rückblick erstellt", "Die Datei wurde erstellt, kann auf diesem Gerät aber nicht geteilt werden.");
    }
  } catch (e) {
    Alert.alert("Fehler", "Der Rückblick konnte nicht erstellt werden. Bitte erneut versuchen.");
  }
}
