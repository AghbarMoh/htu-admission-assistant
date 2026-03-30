import React, { useState, useRef, useEffect } from "react";
import { Send, Menu, X, Mic, Globe, Loader2 } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { Message } from "./types";
import { sendMessageToGeminiBoth } from "./services/geminiService";
import { createClient } from "@supabase/supabase-js";
import { getRelatedQuestions } from "./utils/chatUtils";

// Components
import MessageBubble from "./components/MessageBubble";
import TypingIndicator from "./components/TypingIndicator";
import CountdownCard from "./components/CountdownCard";
import ContactInfoCard from "./components/ContactInfoCard";
import EmailSubscribe from "./components/EmailSubscribe";

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

console.log("DEBUG: Supabase URL is:", supabaseUrl ? "Found ✅" : "MISSING ❌");
console.log("DEBUG: Supabase Key is:", supabaseKey ? "Found ✅" : "MISSING ❌");

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "CRITICAL: Environment variables are not loading. Check your .env file!",
  );
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

/* eslint-disable @typescript-eslint/no-explicit-any */

type Language = "ar" | "en";

const WELCOME_MESSAGE_AR =
  "مرحباً بك في جامعة الحسين التقنية\nيمكنني مساعدتك بالإجابة على أسئلتك حول القبول والتخصصات";
const WELCOME_MESSAGE_EN =
  "Welcome to Al-Hussein Technical University\nI can help answer your questions about admissions and programs";

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>("ar");
  const [dbEntries, setDbEntries] = useState<any[]>([]);
  const [quickQuestionsAr, setQuickQuestionsAr] = useState<string[]>([]);
  const [quickQuestionsEn, setQuickQuestionsEn] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [sessionId] = useState(
    () =>
      `session_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`,
  );

  const [ratingState, setRatingState] = useState({
    submitted: false,
    showForm: false,
    rating: "",
    comment: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const pendingLogRef = useRef<any>(null);

  const isRTL = language === "ar";
  const TEXT_LIMIT = 240;
  const VOICE_LIMIT = 400;

  const toggleLanguage = () =>
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));

  // 1. Database Initialization
  useEffect(() => {
    const initChatbot = async () => {
      const [settingsRes, qaRes] = await Promise.all([
        supabase.from("bot_settings").select("key, value"),
        supabase.from("qa_entries").select("*").eq("is_active", true),
      ]);

      if (qaRes.data) setDbEntries(qaRes.data);

      if (settingsRes.data) {
        const qAr =
          settingsRes.data
            .find((s) => s.key === "quick_questions_ar")
            ?.value.split(",")
            .map((s: string) => s.trim()) || [];
        const qEn =
          settingsRes.data
            .find((s) => s.key === "quick_questions_en")
            ?.value.split(",")
            .map((s: string) => s.trim()) || [];
        setQuickQuestionsAr(qAr);
        setQuickQuestionsEn(qEn);

        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: WELCOME_MESSAGE_AR,
            contentEn: WELCOME_MESSAGE_EN,
            timestamp: new Date(),
            suggestedQuestions: qAr.slice(0, 4),
            suggestedQuestionsEn: qEn.slice(0, 4),
          },
        ]);
      }
    };
    initChatbot();
  }, []);

  // 2. Language & Direction
  useEffect(() => {
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", isRTL ? "ar" : "en");
  }, [language, isRTL]);

  const logChat = (
    params: {
      question: string;
      answer: string;
      rating?: string;
      comment?: string;
      timestamp?: string;
    },
    isExiting = false,
  ) => {
    const {
      question,
      answer,
      rating = "",
      comment = "",
      timestamp = new Date().toLocaleString(),
    } = params;

    const payload = JSON.stringify({
      timestamp,
      question,
      answer,
      sessionId,
      rating,
      comment,
    });

    // We changed this to point ONLY to your local backend!
    const url = "/api/log";

    try {
      fetch(url, {
        method: "POST",
        keepalive: true,
        // mode: 'no-cors' has been DELETED, and Content-Type is now application/json
        headers: { "Content-Type": "application/json" },
        body: payload,
      }).catch((error) => {
        if (!isExiting) console.warn("Logging failed:", error);
      });
    } catch (error) {
      if (!isExiting) console.warn("Logging failed:", error);
    }
  };

  // 3. Auto-scroll (Disabled to let the user scroll manually)
  /* useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
  */
  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      setIsVoiceProcessing(true);
      handleSendMessage(transcript, true);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === "ar" ? "ar-JO" : "en-US";
    }
  }, [language]);

  const toggleVoice = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert(
        language === "ar"
          ? "متصفحك لا يدعم التعرف على الصوت. يرجى استخدام Chrome أو Edge."
          : "Your browser does not support voice recognition. Please use Chrome or Edge.",
      );
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = language === "ar" ? "ar-JO" : "en-US";
        recognitionRef.current.start();
      }
      setIsListening(true);
    }
  };

  const handleSendMessage = async (
    text: string = inputText,
    isVoice: boolean = false,
    isSuggestion: boolean = false, // <--- New flag added
  ) => {
    if (!text.trim() || isLoading) return;

    const currentLimit = isVoice ? VOICE_LIMIT : TEXT_LIMIT;
    if (text.length > currentLimit) {
      alert(
        language === "ar"
          ? `عذراً، الرسالة طويلة جداً. الحد الأقصى هو ${isVoice ? "5 أسطر" : "3 أسطر"}.`
          : `Message too long. Max allowed is ${isVoice ? "5 lines" : "3 lines"}.`,
      );
      setIsVoiceProcessing(false);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      contentEn: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // --- NEW: Scroll only if the user clicked a suggestion ---
    // Scroll down immediately after the user sends ANY message (typing, voice, or suggestion)
    // This reveals the "Typing..." indicator, but stays anchored when the long answer arrives!
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    const arabicSugg = getRelatedQuestions(text, dbEntries, quickQuestionsAr);
    const englishSugg = getRelatedQuestions(text, dbEntries, quickQuestionsEn);

    try {
      const bothResponses = await sendMessageToGeminiBoth(
        text,
        arabicSugg,
        englishSugg,
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: bothResponses.arabic,
        contentEn: bothResponses.english,
        timestamp: new Date(),
        suggestedQuestions: bothResponses.arabicSuggestions,
        suggestedQuestionsEn: bothResponses.englishSuggestions,
      };

      setMessages((prev) => [...prev, botMessage]);

      // --- RECONNECT GOOGLE SHEETS LOGGING ---
      const logData = {
        question: text,
        answer: bothResponses.arabic,
        timestamp: new Date().toLocaleString(),
      };
      logChat(logData);
      pendingLogRef.current = logData;
      setRatingState({
        submitted: false,
        showForm: false,
        rating: "",
        comment: "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsVoiceProcessing(false);
    }
  };

  // --- ADD RATING SUBMIT LOGIC ---
  const handleRatingSubmit = () => {
    let logData = pendingLogRef.current;
    if (!logData && messages.length >= 2) {
      const lastMsg = messages[messages.length - 1];
      const prevMsg = messages[messages.length - 2];
      if (lastMsg.role === "assistant" && prevMsg.role === "user") {
        logData = {
          question: prevMsg.content,
          answer: lastMsg.content,
          timestamp: lastMsg.timestamp.toLocaleString(),
        };
      }
    }
    if (logData) {
      logChat({
        ...logData,
        rating: ratingState.rating,
        comment: ratingState.comment,
      });
      pendingLogRef.current = null;
    }
    setRatingState((prev) => ({ ...prev, submitted: true }));
  };

  const ui = {
    title: isRTL ? "جامعة الحسين التقنية" : "Al-Hussein Technical University",
    placeholder: isRTL ? "اكتب استفسارك هنا..." : "Type your question here...",
    copyright: isRTL
      ? `جامعة الحسين التقنية © ${new Date().getFullYear()}`
      : `HTU © ${new Date().getFullYear()}`,
    ratingQuestion: isRTL
      ? "ما هو تقييمك لهذه الإجابة؟"
      : "How would you rate this answer?",
    ratingThankYou: isRTL
      ? "شكراً على تقييمك! 🙏"
      : "Thank you for your feedback! 🙏",
    ratingPlaceholder: isRTL
      ? "اكتب تعليقك هنا..."
      : "Write your comment here...",
    ratingOptional: isRTL
      ? "هل لديك أي ملاحظات إضافية؟ (اختياري)"
      : "Any additional comments? (optional)",
    sendRating: isRTL ? "إرسال" : "Submit",
  };

  return (
    <div className="flex flex-col h-screen bg-pattern text-white font-sans relative overflow-hidden">
      <header className="sticky top-0 z-30 flex-shrink-0 h-16 bg-[#0a0a0a]/85 border-b border-[#C8102E]/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-full relative flex items-center justify-between">
          <div className="flex items-center z-10 w-10">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-white/70 hover:text-white"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1
              className="font-bold text-lg md:text-2xl text-white tracking-tight pointer-events-auto text-center"
              dir="ltr"
            >
              <span className="text-[#C8102E]">HTU</span>
              <span className="text-white/40 mx-2">|</span>
              <span className="text-white/90 text-sm md:text-base font-medium">
                {isRTL
                  ? "جامعة الحسين التقنية"
                  : "Al-Hussein Technical University"}
              </span>
            </h1>
          </div>

          <div className="flex items-center z-10 w-10 justify-end">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 border border-[#C8102E]/60 text-[#C8102E] rounded-full text-xs font-bold bg-[#C8102E]/10"
            >
              {language === "ar" ? "EN" : "AR"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full p-0 md:p-6 gap-4">
        <aside
          className={`fixed md:relative inset-y-0 z-40 w-80 transition-transform bg-[#140505]/95 border-r border-[#C8102E]/20 backdrop-blur-2xl ${isRTL ? (isSidebarOpen ? "right-0" : "translate-x-full right-0") : isSidebarOpen ? "left-0" : "-translate-x-full left-0"} md:translate-x-0 md:rounded-2xl`}
        >
          <div className="p-4 flex flex-col h-full overflow-y-auto">
            <div className="flex justify-between md:hidden mb-4">
              <span className="font-bold">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X />
              </button>
            </div>
            <CountdownCard language={language} />
            <EmailSubscribe language={language} />
            <ContactInfoCard language={language} />
            <div className="mt-auto pt-4 text-center text-xs text-white/20">
              Made by Mohammad Aghbar
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-[#0f0505]/60 border border-[#C8102E]/15 backdrop-blur-lg md:rounded-2xl overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="flex flex-col pb-4 max-w-3xl mx-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Loader2
                    className="animate-spin text-[#C8102E] mb-4"
                    size={32}
                  />
                  <p className="text-white/40 text-sm">
                    Loading University Data...
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    language={language}
                    // We pass "true" for the isSuggestion flag here!
                    onSuggestionClick={(text) =>
                      handleSendMessage(text, false, true)
                    }
                  />
                ))
              )}

              {/* --- THE RATING UI IS BACK --- */}
              {!isLoading &&
                messages.length > 1 &&
                messages[messages.length - 1].role === "assistant" && (
                  <div
                    className={`mb-6 animate-in fade-in duration-500 ${isRTL ? "mr-11" : "ml-11"}`}
                  >
                    {ratingState.submitted ? (
                      <div
                        className="inline-block px-4 py-2 rounded-full text-sm text-white/70"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        {ui.ratingThankYou}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 items-start">
                        {!ratingState.showForm ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-white/50 text-xs font-medium">
                              {ui.ratingQuestion}
                            </p>
                            <div
                              className="flex gap-2 p-2 rounded-full"
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                  key={num}
                                  onClick={() =>
                                    setRatingState((prev) => ({
                                      ...prev,
                                      rating: num.toString(),
                                      showForm: true,
                                    }))
                                  }
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white/70 hover:text-white transition-all hover:bg-[#C8102E]"
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div
                            className="rounded-2xl p-4 w-full max-w-sm animate-in fade-in"
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)",
                            }}
                          >
                            <p className="text-white/70 text-sm mb-3">
                              {ui.ratingOptional}
                            </p>
                            <textarea
                              value={ratingState.comment}
                              onChange={(e) =>
                                setRatingState((prev) => ({
                                  ...prev,
                                  comment: e.target.value,
                                }))
                              }
                              placeholder={ui.ratingPlaceholder}
                              className="w-full bg-transparent text-white placeholder-white/30 rounded-xl p-3 text-sm focus:outline-none mb-3 min-h-[80px] resize-none"
                              style={{
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                              dir={isRTL ? "rtl" : "ltr"}
                            />
                            <button
                              type="button"
                              onClick={handleRatingSubmit}
                              className="w-full py-2 px-6 rounded-xl font-bold text-sm text-white transition-all bg-[#C8102E] hover:bg-[#a00d24]"
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

          <div className="p-4 border-t border-[#C8102E]/15">
            {(isListening || isVoiceProcessing) && (
              <div className="flex justify-center mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div
                  className="flex items-center gap-3 px-5 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-md"
                  style={{
                    background: isListening
                      ? "rgba(200,16,46,0.15)"
                      : "rgba(255,180,0,0.12)",
                    border: isListening
                      ? "1px solid rgba(200,16,46,0.4)"
                      : "1px solid rgba(255,180,0,0.3)",
                    color: isListening ? "#ff6b6b" : "#ffa500",
                  }}
                >
                  <span
                    className={isListening ? "animate-pulse" : "animate-spin"}
                  >
                    {isListening ? "🎤" : "⏳"}
                  </span>
                  <span className="tracking-wide">
                    {isListening
                      ? isRTL
                        ? "جاري الاستماع..."
                        : "Listening..."
                      : isRTL
                        ? "جاري المعالجة..."
                        : "Processing..."}
                  </span>
                </div>
              </div>
            )}
            <div className="relative max-w-3xl mx-auto bg-[#1e0a0a]/80 border border-[#C8102E]/25 rounded-full px-4 py-2 flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className={`p-2 rounded-full ${isListening ? "bg-[#C8102E] text-white" : "text-[#C8102E]"}`}
              >
                <Mic size={20} />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={ui.placeholder}
                className="flex-1 bg-transparent outline-none text-sm"
                dir={isRTL ? "rtl" : "ltr"}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                  !inputText.trim()
                    ? "text-white/10 opacity-30 scale-90"
                    : "text-white bg-[#C8102E] shadow-[0_0_15px_rgba(200,16,46,0.6)] scale-100 hover:scale-105 active:scale-95"
                }`}
              >
                <Send
                  size={18}
                  className={
                    !inputText.trim()
                      ? ""
                      : "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                  }
                />
              </button>
            </div>
            <div className="text-center mt-3 px-4">
              <p className="text-xs text-white/20 font-medium">
                {ui.copyright}
              </p>
              <p
                className="text-[10px] text-white/15 mt-1 leading-relaxed max-w-md mx-auto"
                dir={isRTL ? "rtl" : "ltr"}
              >
                {isRTL
                  ? "المحتوى مُولَّد بالذكاء الاصطناعي وقد يحتوي على أخطاء. يُرجى التحقق من المعلومات مع دائرة القبول والتسجيل."
                  : "AI-generated content may contain errors. Please verify with the Admissions & Registration Office."}
              </p>
            </div>
          </div>
        </main>
      </div>
      <Analytics />
    </div>
  );
};

export default App;
