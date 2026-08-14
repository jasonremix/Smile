import Constants from "expo-constants";

// Direkter Aufruf der Gemini-API vom Client aus (kein eigener Server) -
// abgesichert nicht durch Geheimhaltung des Schluessels (der steckt im
// App-Bundle und ist damit extrahierbar), sondern durch eine
// App-Einschraenkung auf den Schluessel in der Google Cloud Console
// (nur com.natainc.nata darf ihn benutzen). Das ist Googles offiziell
// vorgesehener Weg fuer mobile Apps, die die Generative-AI-API direkt
// ansprechen, ohne eigenes Backend zu betreiben.
const API_KEY = Constants.expoConfig?.extra?.geminiApiKey;
// "gemini-flash-lite-latest" ist ein von Google gepflegter Alias auf das
// jeweils aktuelle Flash-Lite-Modell - fuer einen Chat-/Support-Bot voellig
// ausreichend und im Live-Test deutlich zuverlaessiger als das groessere
// "gemini-flash-latest" (dort mehrfach "503 high demand"). Ein fest
// benanntes Modell wie "gemini-2.5-flash" war fuer diesen Schluessel
// bereits nicht mehr verfuegbar ("no longer available to new users").
const MODEL = "gemini-flash-lite-latest";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// history: [{ role: "user"|"model", text }] - aeltestes zuerst. systemInstruction
// ist optionaler, fester Kontext (z.B. Ton/Regeln), zaehlt nicht zur Historie.
export async function generateGeminiReply(history, systemInstruction) {
  if (!API_KEY) throw new Error("Gemini-API-Schluessel fehlt (app.json extra.geminiApiKey)");

  const body = {
    contents: history.map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
    ...(systemInstruction
      ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
      : {}),
    generationConfig: {
      // Grosszuegig bemessen: das Modell verbraucht einen Teil davon fuer
      // internes "Thinking" (live getestet - teils 200-400 Tokens allein
      // dafuer), sonst wird die sichtbare Antwort mitten im Satz
      // abgeschnitten (finishReason "MAX_TOKENS"). thinkingConfig zum
      // Abschalten bewusst NICHT gesetzt - fuehrte im Test bei manchen
      // Modellvarianten (z.B. gemini-flash-lite-latest) zu 400-Fehlern.
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  };

  const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini-Anfrage fehlgeschlagen (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!text) throw new Error("Gemini hat keine Antwort geliefert (evtl. durch Sicherheitsfilter blockiert)");
  return text.trim();
}
