import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex w-full mb-8 justify-start">
      <div className="flex flex-row items-start gap-3">

        {/* Avatar */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(200,16,46,0.15)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 0 12px rgba(200,16,46,0.2)'
          }}
        >
          <Bot size={18} className="text-[#C8102E]" />
        </div>

        {/* Dots */}
        <div
          className="flex items-center gap-2 px-5 py-4 rounded-3xl"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px 24px 24px 6px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            minHeight: '54px',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-[#C8102E] animate-bounce opacity-80" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#C8102E] animate-bounce opacity-80" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#C8102E] animate-bounce opacity-80" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;