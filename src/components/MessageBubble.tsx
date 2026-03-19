import React from 'react';
import { Message } from '../types';
import { Bot, User, ArrowLeft, ArrowRight } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  language: 'ar' | 'en';
  onSuggestionClick?: (_question: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, language, onSuggestionClick }) => {
  const isUser = message.role === 'user';
  const isRTL = language === 'ar';
  const content = isRTL ? message.content : (message.contentEn || message.content);
  const suggestions = isRTL
    ? message.suggestedQuestions
    : (message.suggestedQuestionsEn || message.suggestedQuestions);

  const formatContent = (text: string) => {
    const cleanContent = text.replace(/\*\*/g, '');
    return cleanContent.split('\n').map((line, index) => {
      const isList = line.trim().startsWith('-') || line.trim().startsWith('•');
      return (
        <React.Fragment key={index}>
          {isList ? (
            <div className="flex items-start gap-2 my-1">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-white flex-shrink-0 opacity-80"></span>
              <span className="flex-1">{line.replace(/^[-•]\s*/, '')}</span>
            </div>
          ) : (
            <span className="block min-h-[1.2em]">{line}</span>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${
          isUser
            ? 'bg-white text-[#C8102E] border-white/20'
            : 'bg-white/10 text-white border-white/20 backdrop-blur-sm'
        }`}>
          {isUser ? <User size={16} /> : <Bot size={18} />}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full overflow-hidden`}>
          <div
            className={`px-5 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed w-full md:w-auto transition-all duration-200 border ${
              isUser
                ? 'bg-[#C8102E] text-white font-bold border-white/20 rounded-tr-sm'
                : 'bg-[#D2132B] text-white border-white/10 rounded-tl-sm'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {formatContent(content)}
          </div>

          {/* Suggested Questions */}
          {!isUser && suggestions && suggestions.length > 0 && (
            <div className="mt-3 w-full animate-fadeIn relative z-20" style={{ animationDelay: '0.2s' }}>
              <div className="flex flex-col md:flex-row md:flex-wrap gap-2.5 w-full">
                {suggestions.slice(0, 4).map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSuggestionClick && onSuggestionClick(q)}
                    className="group flex items-center justify-between gap-3 bg-white hover:bg-gray-50 text-[#C8102E] border border-white/20 rounded-2xl md:rounded-full px-5 py-3 md:py-2.5 text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 ease-out w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-1 focus:ring-offset-[#C8102E]"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <span className="flex-1">{q}</span>
                    {isRTL
                      ? <ArrowLeft size={16} className="text-[#C8102E] transition-transform duration-200 group-hover:-translate-x-1 flex-shrink-0" />
                      : <ArrowRight size={16} className="text-[#C8102E] transition-transform duration-200 group-hover:translate-x-1 flex-shrink-0" />
                    }
                  </button>
                ))}
              </div>
            </div>
          )}

          <span className="text-[10px] text-white/60 mt-2 px-1 font-medium opacity-80">
            {message.timestamp.toLocaleTimeString(isRTL ? 'ar-JO' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;