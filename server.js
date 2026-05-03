const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `You are a technical expert in roofing and waterproofing in Belgium.
Analyse the roof photo and return ONLY a JSON object. No text before or after. No markdown backticks.
Fill ALL fields in all 3 languages (NL, PL, EN):
{
  "Systeem_NL": "dakopbouw systeem in het Nederlands",
  "Systeem_PL": "system dachu po polsku",
  "Systeem_EN": "roof system in English",
  "Onder_NL": "onderbouw beschrijving in het Nederlands",
  "Onder_PL": "podkonstrukcja po polsku",
  "Onder_EN": "substructure in English",
  "Materiaal_NL": "materiaal en methode in het Nederlands",
  "Materiaal_PL": "materiaal i metoda po polsku",
  "Materiaal_EN": "material and method in English",
  "Detail_NL": "technisch detail in het Nederlands",
  "Detail_PL": "detal techniczny po polsku",
  "Detail_EN": "technical detail in English",
  "Normen_NL": "normen zoals TV 244 TV 215 ATG of geen",
  "Normen_PL": "normy np TV 244 TV 215 ATG lub brak",
  "Normen_EN": "standards eg TV 244 TV 215 ATG or none",
  "Risico_NL": "risicos en aandachtspunten in het Nederlands",
  "Risico_PL": "ryzyka i uwagi po polsku",
  "Risico_EN": "risks and remarks in English",
  "Beschrijving_NL": "educatieve beschrijving 2-3 zinnen in het Nederlands",
  "Beschrijving_PL": "opis edukacyjny 2-3 zdania po polsku",
  "Beschrijving_EN": "educational description 2-3 sentences in English",
  "Status": "NEW"
}`;

app.post('/api/analyze', async (req, res) => {
  const { image, mediaType } = req.body;
  if (!image) return res.status(400).json({ error: 'Brak zdjecia' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Brak klucza API' });

  const header = Buffer.from(image.slice(0, 12), 'base64');
  let detectedType = mediaType || 'image/jpeg';
  if (header[0] === 0x89 && header[1] === 0x50) detectedType = 'image/png';
  else if (header[0] === 0xFF && header[1] === 0xD8) detectedType = 'image/jpeg';
  else if (header[0] === 0x52 && header[1] === 0x49) detectedType = 'image/webp';
  else if (header[0] === 0x47 && header[1] === 0x49) detectedType = 'image/gif';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: detectedType, data: image } },
            { type: 'text', text: 'Analyse this roof photo and return the JSON.' }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });

    const text = data.content?.map(i => i.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Platte Dak Analyse running on port ${PORT}`));
