export const sendMessageToGeminiBoth = async (
  message: string, 
  arabicSuggestions: string[], 
  englishSuggestions: string[]
) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  // If the server fails, try to read the error message it sent back
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = errorBody.message || errorBody.error || `Status: ${response.status}`;
    throw new Error(`BACKEND FAILED: ${errorMessage}`);
  }

  const data = await response.json();
  return {
    arabic: data.arabic,
    english: data.english,
    arabicSuggestions,
    englishSuggestions
  };
};