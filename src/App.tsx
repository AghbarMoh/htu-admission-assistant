import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, X, Mic, MicOff, Globe } from 'lucide-react';
import { Message } from './types';
import { sendMessageToGeminiBoth } from './services/geminiService';
import { QUICK_QUESTIONS, QUICK_QUESTIONS_EN, getRelatedQuestions, getRelatedQuestionsEn } from './constants';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import CountdownCard from './components/CountdownCard';
import ContactInfoCard from './components/ContactInfoCard';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }

  type SpeechRecognition = any;
  type SpeechRecognitionEvent = any;
}

type Language = 'ar' | 'en';

const WELCOME_MESSAGE_AR = 'مرحباً بك في جامعة الحسين التقنية\nيمكنني مساعدتك بالإجابة على أسئلتك حول القبول والتخصصات';
const WELCOME_MESSAGE_EN = 'Welcome to Al-Hussein Technical University\nI can help answer your questions about admissions and programs';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('ar');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME_MESSAGE_AR,
      contentEn: WELCOME_MESSAGE_EN,
      timestamp: new Date(),
      suggestedQuestions: QUICK_QUESTIONS.slice(0, 4),
      suggestedQuestionsEn: QUICK_QUESTIONS_EN.slice(0, 4),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionId] = useState(() => `session_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`);
  const [ratingState, setRatingState] = useState<{
    submitted: boolean;
    showForm: boolean;
    rating: string;
    comment: string;
  }>({
    submitted: false,
    showForm: false,
    rating: '',
    comment: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const pendingLogRef = useRef<{
    question: string;
    answer: string;
    timestamp: string;
  } | null>(null);

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', isRTL ? 'ar' : 'en');
  }, [language, isRTL]);

  const logChat = (params: {
    question: string;
    answer: string;
    rating?: string;
    comment?: string;
    timestamp?: string;
  }, isExiting = false) => {
    const {
      question,
      answer,
      rating = "",
      comment = "",
      timestamp = new Date().toLocaleString()
    } = params;

    const payload = JSON.stringify({
      timestamp,
      question,
      answer,
      sessionId,
      rating,
      comment
    });

    const url = 'https://script.google.com/macros/s/AKfycbwWM4u6vT03fa6JN6zSIAVxdtGLBw7Dw6-oigPZ3nktc6NLaAPrzeTS5395-mjnogs4kw/exec';

    try {
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'text/plain' });
        const success = navigator.sendBeacon(url, blob);
        if (success) return;
      }
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain' },
        body: payload,
      });
    } catch (error) {
      if (!isExiting) console.warn('Logging failed:', error);
    }
  };

  useEffect(() => {
    if (isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLoading]);

  useEffect(() => {
    const handleExit = () => { pendingLogRef.current = null; };
    window.addEventListener('beforeunload', handleExit);
    return () => {
      window.removeEventListener('beforeunload', handleExit);
      pendingLogRef.current = null;
    };
  }, [sessionId]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition() as any;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      handleSendMessage(transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'ar' ? 'ar-JO' : 'en-US';
    }
  }, [language]);

    const toggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(language === 'ar'
        ? 'متصفحك لا يدعم التعرف على الصوت. يرجى استخدام Chrome أو Edge.'
        : 'Your browser does not support voice recognition. Please use Chrome or Edge.'
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = language === 'ar' ? 'ar-JO' : 'en-US';
        recognitionRef.current.start();
      }
      setIsListening(true);
    }
  };

  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;

    pendingLogRef.current = null;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      contentEn: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const bothResponses = await sendMessageToGeminiBoth(
      text,
      getRelatedQuestions,
      getRelatedQuestionsEn
    );

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: bothResponses.arabic,
      contentEn: bothResponses.english,
      timestamp: new Date(),
      suggestedQuestions: bothResponses.arabicSuggestions,
      suggestedQuestionsEn: bothResponses.englishSuggestions,
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
    setRatingState({ submitted: false, showForm: false, rating: '', comment: '' });

    const logData = {
      question: text,
      answer: bothResponses.arabic,
      timestamp: new Date().toLocaleString()
    };

    logChat(logData);
    pendingLogRef.current = logData;
  };

  const handleRatingSubmit = () => {
    let logData = pendingLogRef.current;

    if (!logData && messages.length >= 2) {
      const lastMsg = messages[messages.length - 1];
      const prevMsg = messages[messages.length - 2];
      if (lastMsg.role === 'assistant' && prevMsg.role === 'user') {
        logData = {
          question: prevMsg.content,
          answer: lastMsg.content,
          timestamp: lastMsg.timestamp.toLocaleString()
        };
      }
    }

    if (logData) {
      logChat({ ...logData, rating: ratingState.rating, comment: ratingState.comment });
      pendingLogRef.current = null;
    }

    setRatingState(prev => ({ ...prev, submitted: true }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const ui = {
    title: isRTL ? 'جامعة الحسين التقنية' : 'Al-Hussein Technical University',
    placeholder: isRTL ? 'اكتب استفسارك هنا...' : 'Type your question here...',
    menuLabel: isRTL ? 'القائمة' : 'Menu',
    ratingQuestion: isRTL ? 'ما هو تقييمك لهذه الإجابة؟' : 'How would you rate this answer?',
    ratingThankYou: isRTL ? 'شكراً على تقييمك! 🙏' : 'Thank you for your feedback! 🙏',
    ratingPlaceholder: isRTL ? 'اكتب تعليقك هنا...' : 'Write your comment here...',
    ratingOptional: isRTL ? 'هل لديك أي ملاحظات إضافية؟ (اختياري)' : 'Any additional comments? (optional)',
    sendRating: isRTL ? 'إرسال' : 'Submit',
    copyright: isRTL
      ? `جامعة الحسين التقنية © ${new Date().getFullYear()}`
      : `Al-Hussein Technical University © ${new Date().getFullYear()}`,
    madeBy: 'Made by Mohammad Aghbar',
  };

  return (
    <div>
      {/* your UI stays EXACTLY as before */}
    </div>
  );
};

export default App;