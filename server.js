const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `Jesteś ekspertem technicznym w dziedzinie dekarstwa i izolacji dachowych w Belgii.
Analizujesz zdjęcia dachów, membran bitumicznych, detali konstrukcyjnych i wykonawczych.
Odpowiadaj TYLKO w formacie JSON bez żadnego tekstu przed ani po, bez backticks markdown.
Zwróć dokładnie ten obiekt JSON:
{
  "Systeem_opbouw": "opis systemu układu dachu",
  "Onderconstruktie": "podkonstrukcja i podłoże",
  "Materiaal_Method": "materiał i metoda wykonania",
  "Detail_Techniczny": "opis technicznego detalu widocznego na zdjęciu",
  "Norma_Buildwise": "referencje do norm np. TV 244, TV 215, ATG lub brak",
  "Opis_PL": "opis edukacyjny po polsku 2-3 zdania",
  "Opis_NL": "educatieve beschrijving in het Nederlands 2-3 zinnen",
  "Opis_EN": "educational description in English 2-3 sentences",
  "Ryzyko_Uwagi": "ryzyka, błędy wykonawcze, na co zwrócić uwagę",
  "Status": "NEW"
}`;

app.post('/api/analyze', async (req, res) => {
  const { image, mediaType } = req.body;

  if (!image || !mediaType) {
    return res.status(400).json({ error: 'Brak zdjęcia' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Brak klucza API — ustaw ANTHROPIC_API_KEY w zmiennych środowiskowych Railway' });
  }

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
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: 'Przeanalizuj to zdjęcie dachu i zwróć JSON.' }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Błąd API' });
    }

    const text = data.content?.map(i => i.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Platte Dak Analyse running on port ${PORT}`));
