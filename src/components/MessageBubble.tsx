import React, { useState } from "react";
import { Message } from "../types";
import { Bot, User, ArrowLeft, ArrowRight, Copy, Check } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  language: "ar" | "en";
  onSuggestionClick?: (_question: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  language,
  onSuggestionClick,
}) => {
  const isUser = message.role === "user";
  const isRTL = language === "ar";
  const [copied, setCopied] = useState(false);

  const content = isRTL
    ? message.content
    : message.contentEn || message.content;
  const suggestions = isRTL
    ? message.suggestedQuestions
    : message.suggestedQuestionsEn || message.suggestedQuestions;

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatContent = (text: string) => {
    const cleanContent = text.replace(/\*\*/g, "");
    return cleanContent.split("\n").map((line, index) => {
      const isList = line.trim().startsWith("-") || line.trim().startsWith("•");
      return (
        <React.Fragment key={index}>
          {isList ? (
            <div className="flex items-start gap-2 my-1">
              <span
                className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "#C8102E", opacity: 0.8 }}
              />
              <span className="flex-1 text-white/90">
                {line.replace(/^[-•]\s*/, "")}
              </span>
            </div>
          ) : (
            <span className="block min-h-[1.2em] text-white/90">{line}</span>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div
      className={`flex w-full mb-8 ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
    >
      <div
        className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start gap-3`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${
            isUser ? "bg-[#C8102E]" : "border border-white/10"
          }`}
          style={
            !isUser
              ? {
                  background: "rgba(200,16,46,0.15)",
                  boxShadow: "0 0 12px rgba(200,16,46,0.2)",
                }
              : {}
          }
        >
          {isUser ? (
            <User size={16} className="text-white" />
          ) : (
            <Bot size={18} className="text-[#C8102E]" />
          )}
        </div>

        {/* Content */}
        <div
          className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full overflow-hidden gap-2`}
        >
          {/* Bubble */}
          <div
            className="px-5 py-4 rounded-3xl text-[15px] leading-relaxed w-full md:w-auto"
            style={
              isUser
                ? {
                    background: "#C8102E",
                    boxShadow: "0 4px 20px rgba(200,16,46,0.3)",
                    borderRadius: "24px 24px 6px 24px",
                  }
                : {
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "24px 24px 24px 6px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }
            }
            dir={isRTL ? "rtl" : "ltr"}
          >
            {formatContent(content)}
          </div>

          {/* Copy button for bot messages */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200"
              style={{
                background: copied
                  ? "rgba(200,16,46,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: copied ? "#C8102E" : "rgba(255,255,255,0.4)",
              }}
              title={isRTL ? "نسخ" : "Copy"}
            >
              {copied ? (
                <>
                  <Check size={11} />{" "}
                  <span>{isRTL ? "تم النسخ" : "Copied!"}</span>
                </>
              ) : (
                <>
                  <Copy size={11} /> <span>{isRTL ? "نسخ" : "Copy"}</span>
                </>
              )}
            </button>
          )}

          {/* Suggested Questions */}
          {!isUser && suggestions && suggestions.length > 0 && (
            <div
              className="mt-2 w-full animate-fadeIn"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex flex-col gap-2">
                {suggestions.slice(0, 4).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSuggestionClick && onSuggestionClick(q)}
                    className="suggestion-pill group flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/80 hover:text-white w-full text-right transition-all duration-200"
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <span className="flex-1">{q}</span>
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all"
                      style={{ background: "rgba(200,16,46,0.2)" }}
                    >
                      {isRTL ? (
                        <ArrowLeft size={12} className="text-[#C8102E]" />
                      ) : (
                        <ArrowRight size={12} className="text-[#C8102E]" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <span
            className="text-[10px] px-1 opacity-30"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {message.timestamp.toLocaleTimeString(isRTL ? "ar-JO" : "en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
