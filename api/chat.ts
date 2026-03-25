import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key missing on server' });
  }

  try {
    const { message, instructionAr, instructionEn } = req.body;

    // FIX 1: New SDK requires the key inside an object
    const ai = new GoogleGenAI({ apiKey });

    // FIX 2: Removed 'getGenerativeModel'. 
    // In the new SDK, you call ai.models.generateContent directly.
    const [arabicResult, englishResult] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: message,
        config: { systemInstruction: instructionAr, temperature: 0.3 }
      }),
      ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: message,
        config: { systemInstruction: instructionEn, temperature: 0.3 }
      })
    ]);

    // FIX 3: In the new SDK, the text is a direct property of the response
    return res.status(200).json({
      arabic: arabicResult.text,
      english: englishResult.text
    });

  } catch (error: any) {
    console.error("DETAILED ERROR LOG:", error.message || error);
    return res.status(500).json({ 
      error: 'Gemini 2.0 Execution Failed',
      message: error.message 
    });
  }
}