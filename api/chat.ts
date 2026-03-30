import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// FIX: Change names to match your Vercel Dashboard exactly
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '', 
  process.env.VITE_SUPABASE_ANON_KEY || '' // Using your Anon Key as the "Service Key" for now
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { message } = req.body;
  
  // FIX: Match your Vercel key name (GEMINI_API_KEY)
  const apiKey = process.env.GEMINI_API_KEY;

  // DIAGNOSTIC 1: Check Keys
  if (!apiKey) return res.status(500).json({ error: 'Backend Error: GEMINI_API_KEY is missing.' });
  if (!process.env.VITE_SUPABASE_URL) return res.status(500).json({ error: 'Backend Error: VITE_SUPABASE_URL is missing.' });

  try {
    // 1. Fetch Rules and Data
    const [settingsRes, qaRes] = await Promise.all([
      supabase.from('bot_settings').select('key, value'),
      supabase.from('qa_entries').select('question, answer, keywords, category').eq('is_active', true)
    ]);

    // DIAGNOSTIC 2: Check DB Response
    if (settingsRes.error) throw new Error(`Supabase Settings Error: ${settingsRes.error.message}`);
    
    const rawAr = settingsRes.data?.find(s => s.key === 'system_instruction_ar')?.value;
    const rawEn = settingsRes.data?.find(s => s.key === 'system_instruction_en')?.value;

    if (!rawAr || !rawEn) throw new Error("Backend Error: System instructions not found in database.");

    // 2. Format Dataset
    let dynamicData = "";
    if (qaRes.data && qaRes.data.length > 0) {
      const categories = [...new Set(qaRes.data.map(q => q.category))];
      categories.forEach(cat => {
        dynamicData += `${cat}\n\n`;
        qaRes.data!.filter(q => q.category === cat).forEach(q => {
          dynamicData += `${q.question} || ${q.answer} || ${q.keywords}\n`;
        });
        dynamicData += '\n';
      });
    }

    // 3. Inject Data
    const placeholder = '${HTU_DATASET}';
    const finalAr = rawAr.replace(placeholder, dynamicData.trim());
    const finalEn = rawEn.replace(placeholder, dynamicData.trim());

    // 4. AI Call
    const ai = new GoogleGenAI({ apiKey });
    const [arabicResult, englishResult] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-1.5-flash", // NOTE: Changed to 1.5-flash as 2.5 doesn't exist yet!
        contents: message,
        config: { systemInstruction: finalAr, temperature: 0.3 } 
      }),
      ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: message,
        config: { systemInstruction: finalEn, temperature: 0.3 }
      })
    ]);

    return res.status(200).json({ 
      arabic: arabicResult.text, 
      english: englishResult.text 
    });

  } catch (error: any) {
    console.error("DETAILED BACKEND ERROR:", error.message);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}