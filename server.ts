import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { parseHinglishCommandLocal } from './src/utils/mathEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/parse-hinglish', async (req, res) => {
    const { text, currentDay = 2 } = req.body || {};
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Command text is required' });
      return;
    }

    const localFallback = parseHinglishCommandLocal(text, currentDay);

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json({
        parsed: localFallback,
        engine: 'local-nlp-deterministic',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `You are GharKhata's Hinglish Household Ledger Parser.
Extract structured ledger actions from Indian homemaker voice/text inputs in English, Hinglish, or Hindi.
Known household staff & vendors:
- "sunita": Sunita Didi (House Maid — Jhadu, Pochha, Bartan, Base ₹4,500/mo)
- "rekha": Rekha Mausi (Morning & Evening Cook, Base ₹5,500/mo)
- "ramesh": Ramesh Bhaiya (Mali / Gardener — Weekly Visit & Hourly, ₹150/hr extra)
- "guddu": Guddu Verma (Family Driver, Base ₹14,000/mo, Overtime ₹120/hr)
- "raju": Raju Dhobi (Ironing & Dry Cleaning: Shirts @ ₹7, Trousers @ ₹10, Sarees/Bedsheets @ ₹25, Heavy Suits @ ₹120)
- "milk": Bhola Dairy & Water (Buffalo Milk @ ₹70/L, Paneer, Desi Ghee)

Action types allowed:
- "absent_and_advance": Worker was absent AND took cash advance
- "absent": Worker was absent full day
- "half_day": Worker took half day
- "advance": Worker borrowed Chhota Advance (cash)
- "reimbursement": Worker spent from own pocket for home items (khad, pots, petrol, parking)
- "hours_and_reimbursement": Worker worked hours AND spent from pocket for home purchase
- "overtime": Worker did extra overtime hours
- "party_bhatta": Extra bonus for guest/party utensils or cooking
- "dhobi_give": Gave clothes batch to Raju Dhobi
- "milk_exception": Extra milk liters or dairy side item (paneer, ghee)

Always compute accurate numbers and concise English + Hindi summaries.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: `Current day of month (November 2026): ${currentDay}. Parse this household command: "${text}"`,
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              workerId: { type: Type.STRING },
              workerName: { type: Type.STRING },
              actionType: { type: Type.STRING },
              day: { type: Type.INTEGER },
              amount: { type: Type.NUMBER },
              hours: { type: Type.NUMBER },
              clothCount: { type: Type.INTEGER },
              shirts: { type: Type.INTEGER },
              trousers: { type: Type.INTEGER },
              bedsheets: { type: Type.INTEGER },
              heavySuits: { type: Type.INTEGER },
              milkExtraLiters: { type: Type.NUMBER },
              sideItemName: { type: Type.STRING },
              sideItemCost: { type: Type.NUMBER },
              note: { type: Type.STRING },
              summaryEn: { type: Type.STRING },
              summaryHi: { type: Type.STRING },
              salaryImpactText: { type: Type.STRING },
            },
            required: ['workerId', 'workerName', 'actionType', 'day', 'note', 'summaryEn', 'summaryHi', 'salaryImpactText'],
          },
        },
      });

      const rawText = response.text;
      if (rawText) {
        const aiData = JSON.parse(rawText.trim());
        res.json({
          parsed: {
            ...localFallback,
            ...aiData,
            clothBreakdown: aiData.clothCount
              ? {
                  shirts: aiData.shirts ?? localFallback.clothBreakdown?.shirts ?? 0,
                  trousers: aiData.trousers ?? localFallback.clothBreakdown?.trousers ?? 0,
                  sarees_bedsheets: aiData.bedsheets ?? localFallback.clothBreakdown?.sarees_bedsheets ?? 0,
                  heavy_suits: aiData.heavySuits ?? localFallback.clothBreakdown?.heavy_suits ?? 0,
                }
              : localFallback.clothBreakdown,
          },
          engine: 'gemini-4-argon-high-thinking',
        });
        return;
      }
    } catch (_err) {
      // Fallback cleanly to deterministic local parser so the user experience never breaks
    }

    res.json({
      parsed: localFallback,
      engine: 'local-nlp-deterministic',
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GharKhata server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
