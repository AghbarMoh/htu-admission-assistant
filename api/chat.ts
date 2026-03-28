import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, SYSTEM_INSTRUCTION_EN } from "../src/constants"; 

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ==========================================
  // SECURITY 1: ORIGIN CHECK (CORS Protection)
  // ==========================================
  const origin = req.headers.origin || req.headers.referer;
  
  // These are the ONLY websites allowed to talk to your backend
  const allowedDomains = [
    'http://localhost:3000',      // For your local testing
    'http://localhost:5173',      // For Vite local testing
    'https://htuaibot.xyz',       // Your custom domain!
    'https://www.htuaibot.xyz'    // Your custom domain (with www)
  ];

  // If a request comes from somewhere else, block it!
  if (origin && !allowedDomains.some(domain => origin.startsWith(domain))) {
    console.warn(`Blocked unauthorized request from origin: ${origin}`);
    return res.status(403).json({ error: 'Forbidden: Invalid Origin' });
  }
  // ==========================================

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key missing on server' });
  }

  try {
    const { message } = req.body; 

    // ==========================================
    // SECURITY 2: TOKEN BOMB PROTECTION
    // ==========================================
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    
    // Even if they bypass React, the server strictly limits the size
    if (message.length > 500) {
      return res.status(400).json({ error: 'Message exceeds allowed length' });
    }
    // ==========================================

    const ai = new GoogleGenAI({ apiKey });

    // Send the securely assembled prompt to Gemini
    const [arabicResult, englishResult] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: { systemInstruction: SYSTEM_INSTRUCTION, temperature: 0.3 } 
      }),
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
        config: { systemInstruction: SYSTEM_INSTRUCTION_EN, temperature: 0.3 }
      })
    ]);

    return res.status(200).json({
      arabic: arabicResult.text,
      english: englishResult.text
    });

  } catch (error: any) {
    console.error("DETAILED ERROR LOG:", error.message || error);
    return res.status(500).json({ 
      error: 'Gemini Execution Failed',
      message: error.message 
    });
  }
}