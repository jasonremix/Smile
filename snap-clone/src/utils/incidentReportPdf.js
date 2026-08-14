import { Alert } from "react-native";

// expo-print/expo-sharing sind neue native Module, die erst mit dem
// naechsten nativen Build in den ausgelieferten Apps stecken - wie bei
// expo-location/expo-haptics per require im try/catch nachladen, damit ein
// OTA-Update auf Alt-Installationen nicht abstuerzt.
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

function formatNow() {
  const now = new Date();
  const date = now.toLocaleDateString("de-DE");
  const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time} Uhr`;
}

// Erstellt eine PDF-Zusammenfassung der gerade abgeschickten Meldung und
// oeffnet den System-Teilen-Dialog, damit die Person sie speichern oder
// weitergeben kann. BEWUSST kein automatisches "das ist eine Straftat"-
// Urteil und BEWUSST nicht als "Strafanzeige" betitelt - eine
// Wortfilter-/Client-Einschaetzung ist keine Rechtsberatung. Stattdessen
// ein ehrlicher Vorfallsbericht mit klarem Hinweis, wie eine echte Anzeige
// laeuft.
export async function generateIncidentReportPdf({
  targetDisplayName,
  reasonLabel,
  description,
  incidentTimingLabel,
}) {
  if (!Print || !Sharing) {
    Alert.alert(
      "Update nötig",
      "Der PDF-Export braucht die neueste App-Version. Bitte aktualisiere Nata und versuch es erneut."
    );
    return;
  }

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 32px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .meta { color: #555; font-size: 12px; margin-bottom: 24px; }
          .field { margin-bottom: 16px; }
          .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #777; margin-bottom: 4px; }
          .value { font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
          .disclaimer { margin-top: 32px; padding: 16px; background: #f4f4f4; border-radius: 8px; font-size: 11px; line-height: 1.6; color: #333; }
          .disclaimer strong { display: block; margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <h1>Vorfallsbericht - Nata</h1>
        <div class="meta">Erstellt am ${escapeHtml(formatNow())}</div>

        <div class="field">
          <div class="label">Gemeldete Person</div>
          <div class="value">${escapeHtml(targetDisplayName || "Unbekannt")}</div>
        </div>

        <div class="field">
          <div class="label">Kategorie</div>
          <div class="value">${escapeHtml(reasonLabel || "Nicht angegeben")}</div>
        </div>

        <div class="field">
          <div class="label">Vorfallszeitpunkt</div>
          <div class="value">${escapeHtml(incidentTimingLabel || "Nicht angegeben")}</div>
        </div>

        <div class="field">
          <div class="label">Beschreibung</div>
          <div class="value">${escapeHtml(description || "")}</div>
        </div>

        <div class="disclaimer">
          <strong>Wichtiger Hinweis</strong>
          Dies ist eine Zusammenfassung deiner Meldung in der Nata-App, keine rechtsgültige
          Strafanzeige. Nata trifft keine rechtliche Einschätzung, ob ein Verhalten strafbar ist.
          Wenn du glaubst, Opfer oder Zeuge einer Straftat geworden zu sein, wende dich für eine
          echte Anzeige an die Polizei (z. B. die Online-Wache deines Bundeslandes oder die
          nächste Dienststelle) oder an eine anwaltliche Beratung. In akuten Notfällen wähle 110.
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
      Alert.alert("PDF erstellt", "Das PDF wurde erstellt, kann auf diesem Gerät aber nicht geteilt werden.");
    }
  } catch (e) {
    Alert.alert("Fehler", "Der PDF-Bericht konnte nicht erstellt werden. Bitte erneut versuchen.");
  }
}
