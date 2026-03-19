import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex w-full mb-6 justify-start">
      <div className="flex max-w-[85%] flex-row items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-sm shadow-sm flex items-center justify-center">
          <Bot size={18} />
        </div>
        <div className="bg-[#D2132B] border border-white/10 px-4 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1 space-x-reverse h-[54px]">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce opacity-80" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce opacity-80" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white rounded-full animate-bounce opacity-80" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;