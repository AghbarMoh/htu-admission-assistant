import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, SYSTEM_INSTRUCTION_EN } from "../constants";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

export interface BothResponses {
  arabic: string;
  english: string;
  arabicSuggestions?: string[];
  englishSuggestions?: string[];
}

const fetchArabic = async (userMessage: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userMessage,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.3,
    },
  });
  return response.text || "عذراً، حدث خطأ غير متوقع.";
};

const fetchEnglish = async (userMessage: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userMessage,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_EN,
      temperature: 0.3,
    },
  });
  return response.text || "Sorry, an unexpected error occurred.";
};

export const sendMessageToGeminiBoth = async (
  userMessage: string,
  getArabicSuggestions: (q: string) => string[],
  getEnglishSuggestions: (q: string) => string[]
): Promise<BothResponses> => {
  try {
    const [arabic, english] = await Promise.all([
      fetchArabic(userMessage),
      fetchEnglish(userMessage),
    ]);

    return {
      arabic,
      english,
      arabicSuggestions: getArabicSuggestions(userMessage),
      englishSuggestions: getEnglishSuggestions(userMessage),
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      arabic: "عذراً، أواجه مشكلة في الاتصال بالنظام. يرجى المحاولة لاحقاً.",
      english: "Sorry, I'm experiencing a connection issue. Please try again later.",
      arabicSuggestions: getArabicSuggestions(userMessage),
      englishSuggestions: getEnglishSuggestions(userMessage),
    };
  }
};