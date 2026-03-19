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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      recognitionRef.current!.lang = language === 'ar' ? 'ar-JO' : 'en-US';
      recognitionRef.current?.start();
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
    <div className="flex flex-col h-full bg-pattern text-gray-800 font-sans relative overflow-hidden">

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 z-30 sticky top-0 h-16 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 h-full relative flex items-center justify-between">

          {/* Right Section - Menu Button */}
          <div className="flex items-center gap-2 z-10">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Center - Title */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="font-bold text-lg md:text-2xl text-[#C8102E] tracking-tight pointer-events-auto text-center px-16 md:px-0">
              {ui.title}
            </h1>
          </div>

          {/* Left Section - Call + Language Toggle */}
          <div className="flex items-center gap-2 z-10">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E] hover:text-white transition-all duration-200 text-sm font-bold"
              aria-label="Toggle language"
            >
              <Globe size={15} />
              <span>{language === 'ar' ? 'EN' : 'AR'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full relative p-0 md:p-6 gap-6">

        {/* Sidebar */}
        <aside className={`
          fixed md:relative inset-y-0 z-40 w-80
          bg-[#C8102E] md:bg-gradient-to-b md:from-[#B30F27] md:to-[#C8102E]
          text-white
          transform transition-transform duration-300 ease-in-out md:translate-x-0
          shadow-2xl flex flex-col h-full
          ${isRTL
            ? `right-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:rounded-2xl border-l border-[#A00D25]`
            : `left-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:rounded-2xl border-r border-[#A00D25]`
          }
        `}>
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between md:hidden mb-4">
              <h2 className="font-bold text-lg text-white">{ui.menuLabel}</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <CountdownCard language={language} />
            <ContactInfoCard language={language} />
            <div className="mt-auto pt-4 text-center border-t border-white/10">
              <p className="text-xs text-white font-medium leading-relaxed" dir="ltr">
                {ui.madeBy}
              </p>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col relative z-10 w-full bg-[#C8102E] rounded-none md:rounded-2xl shadow-none md:shadow-xl border-none md:border border-white/10 overflow-hidden">

          <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
            <div className="flex flex-col pb-4 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  language={language}
                  onSuggestionClick={handleSendMessage}
                />
              ))}

              {/* Rating UI */}
              {!isLoading && messages.length > 1 && messages[messages.length - 1].role === 'assistant' && (
                <div className={`mb-6 animate-fadeIn ${isRTL ? 'mr-11' : 'ml-11'}`}>
                  {ratingState.submitted ? (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-white text-sm inline-block">
                      {ui.ratingThankYou}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 items-start">
                      {!ratingState.showForm ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-white text-xs font-medium mb-1 opacity-90">{ui.ratingQuestion}</p>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                onClick={() => setRatingState(prev => ({ ...prev, rating: num.toString(), showForm: true }))}
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-xl w-10 h-10 flex items-center justify-center transition-all text-white font-bold"
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-[#B30F27] border border-white/10 rounded-2xl p-4 shadow-lg w-full max-w-sm animate-fadeIn">
                          <p className="text-white text-sm mb-3 font-medium">{ui.ratingOptional}</p>
                          <textarea
                            value={ratingState.comment}
                            onChange={(e) => setRatingState(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder={ui.ratingPlaceholder}
                            className="w-full bg-[#C8102E] text-white placeholder-white/50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/10 mb-3 min-h-[80px] resize-none"
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                          <button
                            type="button"
                            onClick={handleRatingSubmit}
                            className="bg-white text-[#C8102E] font-bold py-2 px-6 rounded-xl hover:bg-gray-100 transition-colors text-sm w-full shadow-md active:scale-[0.98]"
                          >
                            {ui.sendRating}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#B30F27] border-t border-white/10 relative z-30">
            <div className="relative flex items-center gap-2 max-w-3xl mx-auto">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={ui.placeholder}
                className={`flex-1 bg-[#C8102E] text-white placeholder-white/60 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/10 block w-full p-4 shadow-inner transition-all ${isRTL ? 'pr-4 pl-24' : 'pl-4 pr-24'}`}
                disabled={isLoading}
                dir={isRTL ? 'rtl' : 'ltr'}
              />

              {/* Voice Button */}
              <button
                onClick={toggleVoice}
                className={`absolute p-2 rounded-xl transition-all duration-200 ${isRTL ? 'left-10' : 'right-10'} ${
                  isListening
                    ? 'text-yellow-300 animate-pulse'
                    : 'text-white opacity-70 hover:opacity-100 hover:bg-white/10'
                }`}
                title={isListening
                  ? (isRTL ? 'إيقاف التسجيل' : 'Stop recording')
                  : (isRTL ? 'تسجيل صوتي' : 'Voice input')
                }
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className={`absolute p-2 rounded-xl transition-all duration-200 text-white ${isRTL ? 'left-2' : 'right-2'} ${
                  !inputText.trim() || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 opacity-100'
                }`}
              >
                <Send size={20} />
              </button>
            </div>

            <div className="text-center mt-3">
              <p className="text-xs text-white/90 font-medium">{ui.copyright}</p>
            </div>
          </div>
        </main>
       
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;