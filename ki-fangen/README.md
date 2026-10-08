# KI-Fänger

Browser-Spiel (reines HTML, CSS, JavaScript, ohne Build-Schritt und ohne Backend).

- Lokal testen: `python3 -m http.server 8000` in diesem Ordner, dann http://localhost:8000
- Vercel: Projekt importieren, **Root Directory** auf `ki-fangen` setzen, Framework Preset „Other“, kein Build Command.
- Spielstand liegt nur im localStorage des Browsers.
- Fragen: `data.js` (Antwort an Index 0 ist richtig). Karten: `maps.js`.
