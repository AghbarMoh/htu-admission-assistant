export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  contentEn?: string;
  timestamp: Date;
  suggestedQuestions?: string[];
  suggestedQuestionsEn?: string[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
