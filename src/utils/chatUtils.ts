// src/utils/chatUtils.ts

export const getRelatedQuestions = (userQuery: string, entries: any[], quickQuestions: string[]): string[] => {
  if (!userQuery) return quickQuestions;

  const queryTerms = userQuery.toLowerCase().replace(/[؟?،,.]/g, '').split(/\s+/).filter(w => w.length > 2);
  if (queryTerms.length === 0) return quickQuestions;

  const scores = entries.map(entry => {
    const questionLower = entry.question.toLowerCase();
    const keywordsLower = (entry.keywords || "").toLowerCase();
    let score = 0;
    queryTerms.forEach(term => {
      if (questionLower.includes(term)) score += 5;
      if (keywordsLower.includes(term)) score += 2;
    });
    return { question: entry.question, score };
  });

  return scores
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.question)
    .filter((q, index, self) => self.indexOf(q) === index && q !== userQuery)
    .slice(0, 4);
};