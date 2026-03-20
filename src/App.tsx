import React, { useState, useRef, useEffect } from 'react';
import { Send, Menu, X, Mic, MicOff, Globe } from 'lucide-react';
import { Message } from './types';
import { sendMessageToGeminiBoth } from './services/geminiService';
import { QUICK_QUESTIONS, QUICK_QUESTIONS_EN, getRelatedQuestions, getRelatedQuestionsEn } from './constants';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import CountdownCard from './components/CountdownCard';
import ContactInfoCard from './components/ContactInfoCard';
import EmailSubscribe from './components/EmailSubscribe';


/* eslint-disable @typescript-eslint/no-explicit-any */

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
      timestamp, question, answer, sessionId, rating, comment
    });

    const url = 'https://script.google.com/macros/s/AKfycbwWM4u6vT03fa6JN6zSIAVxdtGLBw7Dw6-oigPZ3nktc6NLaAPrzeTS5395-mjnogs4kw/exec';

    try {
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'text/plain' });
        const success = navigator.sendBeacon(url, blob);
        if (success) return;
      }
      fetch(url, {
        method: 'POST', mode: 'no-cors', keepalive: true,
        headers: { 'Content-Type': 'text/plain' }, body: payload,
      });
    } catch (error) {
      if (!isExiting) console.warn('Logging failed:', error);
    }
  };

  useEffect(() => {
    if (isLoading) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
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
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(language === 'ar'
        ? 'متصفحك لا يدعم التعرف على الصوت. يرجى استخدام Chrome أو Edge.'
        : 'Your browser does not support voice recognition. Please use Chrome or Edge.');
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
      text, getRelatedQuestions, getRelatedQuestionsEn
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

  const toggleLanguage = () => setLanguage(prev => prev === 'ar' ? 'en' : 'ar');

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
    <div className="flex flex-col h-full bg-pattern text-white font-sans relative overflow-hidden">

      {/* Header */}
      <header className="sticky top-0 z-30 flex-shrink-0 h-16"
        style={{ background: 'rgba(10,10,10,0.85)', borderBottom: '1px solid rgba(200,16,46,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 h-full relative flex items-center justify-between">

          {/* Menu button */}
          <div className="flex items-center gap-2 z-10">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              aria-label="Toggle menu"
              title="Toggle menu"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Title */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="font-bold text-lg md:text-2xl text-white tracking-tight pointer-events-auto text-center px-16 md:px-0"dir="ltr">
              <span className="text-[#C8102E] relative top-[3.5px]">HTU</span>
              <span className="text-white/90 text-base md:text-lg font-normal mx-2">|</span>
              <span className="text-white/90 text-sm md:text-base font-medium">
                {isRTL ? 'جامعة الحسين التقنية' : 'Al-Hussein Technical University'}
              </span>
            </h1>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-2 z-10">
           <button
  onClick={toggleLanguage}
  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all duration-200"
  style={{
    border: '1px solid rgba(200,16,46,0.6)',
    color: '#C8102E',
    background: 'rgba(200,16,46,0.08)'
  }}
  aria-label="Toggle language"
>
  <Globe size={11} />
  <span>{language === 'ar' ? 'EN' : 'AR'}</span>
</button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full relative p-0 md:p-6 gap-4">

        {/* Sidebar */}
        <aside className={`
          fixed md:relative inset-y-0 z-40 w-80
          text-white transform transition-transform duration-300 ease-in-out md:translate-x-0
          shadow-2xl flex flex-col h-full md:rounded-2xl overflow-hidden
          ${isRTL
            ? `right-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`
            : `left-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
          }
        `}
          style={{
            background: 'rgba(20,5,5,0.95)',
            border: '1px solid rgba(200,16,46,0.2)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
            <div className="p-4 flex flex-col h-full overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between md:hidden mb-4">
              <h2 className="font-bold text-lg text-white">{ui.menuLabel}</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-white/60 hover:text-white transition-colors"
                title="Close menu"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            <CountdownCard language={language} />
            <EmailSubscribe language={language} />
            <ContactInfoCard language={language} />
            <div className="mt-auto pt-4 text-center border-t border-white/10">
              <p className="text-xs text-white/40 font-medium" dir="ltr">{ui.madeBy}</p>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden md:rounded-2xl"
          style={{
            background: 'rgba(15,5,5,0.6)',
            border: '1px solid rgba(200,16,46,0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {/* Messages */}
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
                    <div className="inline-block px-4 py-2 rounded-full text-sm text-white/70"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {ui.ratingThankYou}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 items-start">
                      {!ratingState.showForm ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-white/50 text-xs font-medium">{ui.ratingQuestion}</p>
                          <div className="flex gap-2 p-2 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                onClick={() => setRatingState(prev => ({ ...prev, rating: num.toString(), showForm: true }))}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white/70 hover:text-white transition-all hover:bg-[#C8102E]"
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl p-4 w-full max-w-sm animate-fadeIn"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <p className="text-white/70 text-sm mb-3">{ui.ratingOptional}</p>
                          <textarea
                            value={ratingState.comment}
                            onChange={(e) => setRatingState(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder={ui.ratingPlaceholder}
                            className="w-full text-white placeholder-white/30 rounded-xl p-3 text-sm focus:outline-none mb-3 min-h-[80px] resize-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                          <button
                            type="button"
                            onClick={handleRatingSubmit}
                            className="w-full py-2 px-6 rounded-xl font-bold text-sm text-white transition-all"
                            style={{ background: '#C8102E' }}
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
          <div className="p-4 relative z-30"
            style={{ borderTop: '1px solid rgba(200,16,46,0.15)' }}>
            <div className="relative max-w-3xl mx-auto input-glow rounded-full"
              style={{
                background: 'rgba(30,10,10,0.8)',
                border: '1px solid rgba(200,16,46,0.25)',
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={ui.placeholder}
                className={`w-full bg-transparent text-white placeholder-white/30 text-base focus:outline-none py-4 ${isRTL ? 'pr-5 pl-28' : 'pl-5 pr-28'}`}
                disabled={isLoading}
                dir={isRTL ? 'rtl' : 'ltr'}
              />

              {/* Voice button */}
              <button
                onClick={toggleVoice}
                className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200 ${isRTL ? 'left-14' : 'right-14'} ${
                  isListening ? 'text-[#C8102E] animate-pulse' : 'text-white/40 hover:text-white/70'
                }`}
                title={isListening ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'صوت' : 'Voice')}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Send orb */}
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                title={isRTL ? 'إرسال' : 'Send'}
                aria-label={isRTL ? 'إرسال' : 'Send'}
                className={`send-orb absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${isRTL ? 'left-2' : 'right-2'} ${
                  !inputText.trim() || isLoading ? 'opacity-40 cursor-not-allowed' : 'opacity-100'
                }`}
              >
                <Send size={16} className="text-white" />
              </button>
            </div>

           <div className="text-center mt-3 px-4">
              <p className="text-xs text-white/20 font-medium">{ui.copyright}</p>
                <p className="text-[10px] text-white/15 mt-1 leading-relaxed max-w-md mx-auto"
                   dir={isRTL ? 'rtl' : 'ltr'}>
                     {isRTL
                         ? 'المحتوى مُولَّد بالذكاء الاصطناعي وقد يحتوي على أخطاء. يُرجى التحقق من المعلومات مع دائرة القبول والتسجيل.'
                          : 'AI-generated content may contain errors. Please verify with the Admissions & Registration Office.'
                     }
  </p>
</div>
          </div>
        </main>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            style={{ backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;