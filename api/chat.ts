import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Verify API Key exists
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables.");
    return res.status(500).json({ error: 'Server Configuration Error: API Key missing' });
  }

  try {
    const { message, instructionAr, instructionEn } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 3. Process both languages
    const [arabicResponse, englishResponse] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: { systemInstruction: instructionAr, temperature: 0.3 },
      }),
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: { systemInstruction: instructionEn, temperature: 0.3 },
      })
    ]);

    return res.status(200).json({
      arabic: arabicResponse.text,
      english: englishResponse.text
    });

  } catch (error: any) {
    // This will show up in your Vercel logs
    console.error("GEMINI BACKEND ERROR:", error.message || error);
    return res.status(500).json({ 
      error: 'Failed to generate content',
      details: error.message 
    });
  }
}