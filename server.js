const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = `You are a senior technical expert in flat roof construction and waterproofing in Belgium, with deep knowledge of Belgian and Dutch standards.

KNOWLEDGE BASE - use this to verify and enrich your analysis:

BELGIAN LEGAL FRAMEWORK:
- NBN standards (Belgian technical norms)
- Buildwise/WTCB guidelines: TV 215 (bitumen), TV 244 (flat roofs), TV 280 (details)
- STS 04 specification for roof coverings
- Eurocodes for wind and snow loads

ROOF SLOPE (AFSCHOT):
- Minimum structural slope: 2%
- Recommended design slope: 2-5%
- Standing water after 1 hour: max 5% of roof surface, max depth 5mm (10mm in gutter zones)
- No standing water = no ponding risk

ROOF BUILD-UP (WARM DAK - standard):
Layer order from bottom to top:
1. Structural base (onderconstructie): concrete, OSB, steel deck, wood planks
2. Vapour barrier (damprem/sluitlaag): bitumen or PE foil
3. Thermal insulation: PIR/PUR/EPS/mineral wool
4. Waterproofing membrane: APP/SBS bitumen, EPDM, PVC, TPO
5. Optional protection layer

THERMAL INSULATION REQUIREMENTS:
- Belgium: Rc ≥ 4.5 m²K/W minimum
- PIR/PUR: best performance per mm
- EPS: economical option
- Mineral wool (MWR): fire resistant
- XPS: only for inverted roof (omgekeerd dak)
- Vapour barrier required with PIR, PUR, MWR, EPS, EPB

MEMBRANE APPLICATION RULES:
- SBS membrane: torch applied (vlamlassen), max strip length ~1m for good heat penetration
- APP membrane: torch applied
- Minimum side overlap (langsnaad): 80mm minimum, 100mm recommended
- Minimum end overlap (dwarsnaad): 150mm minimum
- Why short strips when torching: ensures complete fusion, avoids cold spots and delamination
- Primer (hechtingslaag/grondlaag) always required on concrete before torching
- On wood/steel: never use open flame - use cold adhesive or self-adhesive membrane

CRITICAL DETAILS (most common leak locations):
- Opstand (upstand/attika): minimum height 150mm above finished roof level
- At base of opstand: primer always required before torching
- Corner pieces (mastiekhoek/klossie): required at all internal and external corners
- Penetrations (dakdoorvoeren): collar (kraag) + minimum 150mm upstand around pipe
- Roof drains (wpusty): minimum 2 drains per roof + 1 emergency overflow in parapet
- Drip edge profile (druiprandprofiel): membrane must be turned over and welded to profile
- Movement joints: special detail required, never bridge with single membrane layer

MECHANICAL FASTENING:
- At roof edges and all upstands: start with fasteners h.o.h. 250mm
- Minimum 3 fasteners per m² for two-layer systems
- Fastener pull-out strength: minimum 400N per fastener

SUBSTRUCTURE REQUIREMENTS:
- Flatness tolerance: max 5mm over 1000mm
- Must be dry, clean, free of dust/grease
- Concrete: prime with bitumen solution before any membrane
- Wood/OSB: no open flame allowed - cold adhesive only
- Steel deck: membrane laid parallel to deck ribs

CONDENSATION / VAPOUR CONTROL:
- Max annual condensation: 1000 g/m² for stone/concrete, 200 g/m² for wood-based
- Summer drying must exceed winter condensation
- Vapour barrier continuity critical at all edges and penetrations

INVERTED ROOF (OMGEKEERD DAK):
- Waterproofing BELOW insulation
- Insulation: XPS only (water resistant)
- Ballast layer required on top

FIRE SAFETY (NEN 6050):
- No open flame within 750mm of upstands with combustible cladding
- No open flame near gutters and dormers
- At penetrations: use non-combustible insulation class A2 within ~1m²

COMMON DEFECTS TO FLAG:
- Missing or insufficient primer on concrete
- Insufficient overlap (< 80mm side, < 150mm end)
- Opstand height < 150mm
- Missing corner pieces at angles
- No emergency overflow in parapet
- Roof slope < 2% (ponding risk)
- Membrane torched on wood without protection (fire risk)
- Missing aeration vents on large roof areas (blistering risk)

Analyse the roof photo carefully. Compare what you see against the knowledge base above.
Return ONLY a JSON object. No text before or after. No markdown backticks.

JSON structure - fill ALL fields in all 3 languages:
{
  "Systeem_NL": "dakopbouw systeem beschrijving",
  "Systeem_PL": "opis systemu dachu",
  "Systeem_EN": "roof system description",
  "Onder_NL": "onderbouw/ondergrond beschrijving",
  "Onder_PL": "podkonstrukcja opis",
  "Onder_EN": "substructure description",
  "Materiaal_NL": "materiaal en methode van aanbrengen",
  "Materiaal_PL": "materiał i metoda układania",
  "Materiaal_EN": "material and application method",
  "Detail_NL": "zichtbare technische details, afmetingen indien zichtbaar",
  "Detail_PL": "widoczne detale techniczne, wymiary jeśli widoczne",
  "Detail_EN": "visible technical details, dimensions if visible",
  "Normen_NL": "toepasselijke normen: TV 244, TV 215, STS 04, NBN etc.",
  "Normen_PL": "obowiązujące normy: TV 244, TV 215, STS 04, NBN itp.",
  "Normen_EN": "applicable standards: TV 244, TV 215, STS 04, NBN etc.",
  "Conformiteit_NL": "wat is correct uitgevoerd conform de normen",
  "Conformiteit_PL": "co zostało wykonane prawidłowo zgodnie z normami",
  "Conformiteit_EN": "what is correctly executed according to standards",
  "Risico_NL": "afwijkingen van normen, risicos, aandachtspunten met concrete waarden",
  "Risico_PL": "odchylenia od norm, ryzyka, uwagi z konkretnymi wartościami",
  "Risico_EN": "deviations from standards, risks, remarks with concrete values",
  "Beschrijving_NL": "educatieve beschrijving 2-3 zinnen voor vakmensen",
  "Beschrijving_PL": "opis edukacyjny 2-3 zdania dla fachowców",
  "Beschrijving_EN": "educational description 2-3 sentences for professionals",
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
        model: 'claude-opus-4-7',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: detectedType, data: image } },
            { type: 'text', text: 'Analyse this roof photo thoroughly and return the JSON.' }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'API error' });

    const text = data.content?.map(i => i.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Naprawa typowych literówek modelu w nazwach kluczy
    const keyFixes = {
      'Risiko_PL': 'Risico_PL',
      'Risiko_NL': 'Risico_NL',
      'Risiko_EN': 'Risico_EN'
    };
    for (const [wrong, right] of Object.entries(keyFixes)) {
      if (parsed[wrong] && !parsed[right]) {
        parsed[right] = parsed[wrong];
        delete parsed[wrong];
      }
    }

    res.json(parsed);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Platte Dak Analyse running on port ${PORT}`));
