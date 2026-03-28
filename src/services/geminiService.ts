// 1. Notice we completely removed the import from "../constants" up here!

export interface BothResponses {
  arabic: string;
  english: string;
  arabicSuggestions?: string[];
  englishSuggestions?: string[];
}

export const sendMessageToGeminiBoth = async (
  userMessage: string,
  getArabicSuggestions: (q: string) => string[],
  getEnglishSuggestions: (q: string) => string[]
): Promise<BothResponses> => {
  try {
    // We now fetch from our own secure backend endpoint instead of Google directly
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 2. SECURE: Only send the message. The server now handles the instructions safely.
      body: JSON.stringify({
        message: userMessage
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      arabic: data.arabic || "عذراً، حدث خطأ غير متوقع.",
      english: data.english || "Sorry, an unexpected error occurred.",
      arabicSuggestions: getArabicSuggestions(userMessage),
      englishSuggestions: getEnglishSuggestions(userMessage),
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    const errorMessage = error?.message || String(error);
    const isOverloaded = errorMessage.includes("503") || errorMessage.includes("high demand");

    if (isOverloaded) {
      return {
        arabic: "عذراً، النظام يواجه ضغطاً كبيراً في الطلبات حالياً. يرجى المحاولة مرة أخرى بعد قليل.",
        english: "Sorry, the AI is currently experiencing high demand. Please try again in a few moments.",
        arabicSuggestions: getArabicSuggestions(userMessage),
        englishSuggestions: getEnglishSuggestions(userMessage),
      };
    }

    return {
      arabic: "عذراً، أواجه مشكلة في الاتصال بالنظام. يرجى المحاولة لاحقاً.",
      english: "Sorry, I'm experiencing a connection issue. Please try again later.",
      arabicSuggestions: getArabicSuggestions(userMessage),
      englishSuggestions: getEnglishSuggestions(userMessage),
    };
  }
};