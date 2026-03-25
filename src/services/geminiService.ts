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
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Check if the error is a 503 Service Unavailable / High Demand
    const errorMessage = error?.message || String(error);
    const isOverloaded = error?.status === 503 || errorMessage.includes("503") || errorMessage.includes("high demand");

    if (isOverloaded) {
      return {
        arabic: "عذراً، النظام يواجه ضغطاً كبيراً في الطلبات حالياً. يرجى المحاولة مرة أخرى بعد قليل.",
        english: "Sorry, the AI is currently experiencing high demand. Please try again in a few moments.",
        arabicSuggestions: getArabicSuggestions(userMessage),
        englishSuggestions: getEnglishSuggestions(userMessage),
      };
    }

    // Default fallback for any other errors
    return {
      arabic: "عذراً، أواجه مشكلة في الاتصال بالنظام. يرجى المحاولة لاحقاً.",
      english: "Sorry, I'm experiencing a connection issue. Please try again later.",
      arabicSuggestions: getArabicSuggestions(userMessage),
      englishSuggestions: getEnglishSuggestions(userMessage),
    };
  }
};