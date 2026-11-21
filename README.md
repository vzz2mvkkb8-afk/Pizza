# Pizzateig-Rechner

Web-App (PWA) zum Berechnen von Pizzateig – Napoletana und Romana in Teglia.
Hinweis: In der App heisst das Wasser „Sprudel“ (Mineralwasser mit Kohlensäure), die Menge ist dieselbe.
Die Berechnung ist 1:1 vom Pizzateig-Rechner von pizzapastabros.ch übernommen (`public/calc.js`),
`npm test` prüft 3840 Kombinationen gegen die Original-Gleichungen.

- Start lokal: `npm start` → http://localhost:3000
- Live über GitHub Pages: `.github/workflows/pages.yml` veröffentlicht den Ordner `public/` bei jedem Push.
  Einmalig nötig: Settings → Pages → Source „GitHub Actions“ (bei privatem Repo braucht Pages GitHub Pro, sonst Repo öffentlich machen).
- Optional Railway: Start-Befehl `npm start` (siehe `railway.json`).
- iPhone: Seite in Safari öffnen → Teilen → „Zum Home-Bildschirm“.
