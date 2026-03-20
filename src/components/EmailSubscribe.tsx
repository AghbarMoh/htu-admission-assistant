import React, { useState } from 'react';
import { Mail, Send, Check, Loader } from 'lucide-react';

interface EmailSubscribeProps {
  language: 'ar' | 'en';
}

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVbMfZUUIH8-vp19-SxiNbMtCDu4qSpf0vqMFg7NhVG725YcxUr9YvPyeeEzwDcLpdpA/exec';

const EmailSubscribe: React.FC<EmailSubscribeProps> = ({ language }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const isRTL = language === 'ar';

  const labels = {
    title: isRTL ? 'ابقَ على اطلاع' : 'Stay Updated',
    subtitle: isRTL
      ? 'اشترك لتلقّي آخر أخبار القبول المبكر'
      : 'Subscribe for early admission updates',
    placeholder: 'example@email.com',
    submit: isRTL ? 'اشتراك' : 'Subscribe',
    success: isRTL ? 'تم الاشتراك بنجاح! 🎉' : 'Subscribed successfully! 🎉',
    error: isRTL ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, try again',
    invalidEmail: isRTL ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email',
  };

  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    if (!isValidEmail(email)) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('loading');

    const payload = JSON.stringify({
      timestamp: new Date().toLocaleString(),
      email: email.trim(),
    });

    try {
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'text/plain' });
        navigator.sendBeacon(SCRIPT_URL, blob);
      } else {
        fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: payload,
        });
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="rounded-2xl p-4 mb-4"
      style={{
        background: 'rgba(200,16,46,0.06)',
        border: '1px solid rgba(200,16,46,0.2)',
      }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Mail size={16} className="text-[#C8102E]" />
        <h3 className="font-bold text-sm text-white">{labels.title}</h3>
      </div>

      {/* Subtitle */}
      <p className="text-xs text-white/40 mb-3 leading-relaxed"
        dir={isRTL ? 'rtl' : 'ltr'}>
        {labels.subtitle}
      </p>

      {/* Success State */}
      {status === 'success' ? (
        <div className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm"
          style={{ background: 'rgba(200,16,46,0.12)', border: '1px solid rgba(200,16,46,0.2)' }}>
          <Check size={16} className="text-[#C8102E]" />
          <span className="text-white/70">{labels.success}</span>
        </div>
      ) : (
        <>
          {/* Input */}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={labels.placeholder}
            disabled={status === 'loading'}
            className="w-full text-sm text-white placeholder-white/20 rounded-xl px-3 py-2.5 mb-2 focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: status === 'error'
                ? '1px solid rgba(200,16,46,0.6)'
                : '1px solid rgba(255,255,255,0.08)',
            }}
            dir="ltr"
          />

          {/* Error message */}
          {status === 'error' && (
            <p className="text-[10px] text-[#C8102E] mb-2 px-1"
              dir={isRTL ? 'rtl' : 'ltr'}>
              {labels.error}
            </p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!email.trim() || status === 'loading'}
            className="w-full py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: email.trim() && status !== 'loading'
                ? '#C8102E'
                : 'rgba(255,255,255,0.06)',
              opacity: !email.trim() ? 0.5 : 1,
            }}
          >
            {status === 'loading'
              ? <Loader size={15} className="animate-spin" />
              : <><Send size={13} /><span>{labels.submit}</span></>
            }
          </button>
        </>
      )}
    </div>
  );
};

export default EmailSubscribe;