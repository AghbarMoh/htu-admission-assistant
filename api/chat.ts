import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, instructionAr, instructionEn } = req.body;

  // The Vercel server reads this securely. It is NEVER sent to the browser.
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY, 
  });

  try {
    // Fetch both languages simultaneously on the server
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

    res.status(200).json({
      arabic: arabicResponse.text,
      english: englishResponse.text
    });
  } catch (error: any) {
    console.error("Backend API Error:", error);
    res.status(error?.status || 500).json({ error: error.message });
  }
}