# Platte Dak Analyse 🏠

AI-powered technische analyse van platte daken. Upload een foto → krijg een volledig technisch rapport in PL/NL/EN.

## Lokaal draaien

```bash
npm install
cp .env.example .env
# Vul je ANTHROPIC_API_KEY in in .env
npm start
# Open http://localhost:3000
```

## Deploy op Railway

1. Push naar GitHub
2. Ga naar [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Selecteer deze repo
4. Ga naar **Variables** → voeg toe:
   ```
   ANTHROPIC_API_KEY = sk-ant-...jouw-sleutel...
   ```
5. Railway deploy automatisch — je krijgt een publieke URL

## Hoe werkt het

- Gebruiker upload een foto van een plat dak
- Backend stuurt het naar Claude AI (Anthropic)
- AI analyseert en geeft terug: systeem, materiaal, normen (TV244/TV215), risico's
- Resultaat in 3 talen: PL / NL / EN
- Export naar CSV mogelijk

## Tech stack

- Node.js + Express (backend)
- Vanilla JS PWA (frontend — werkt op telefoon en PC)
- Anthropic Claude API (AI-analyse)
- Railway (hosting)
