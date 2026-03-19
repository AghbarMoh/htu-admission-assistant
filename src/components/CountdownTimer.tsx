import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  language: 'ar' | 'en';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ language }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    const deadline = new Date('2026-05-07T23:59:59').getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = deadline - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const labels = isRTL
    ? { title: 'نهاية القبول المبكر', deadline: 'الموعد النهائي: 7 أيار 2026', seconds: 'ثانية', minutes: 'دقيقة', hours: 'ساعة', days: 'يوم' }
    : { title: 'Early Admission Deadline', deadline: 'Deadline: May 7, 2026', seconds: 'Sec', minutes: 'Min', hours: 'Hrs', days: 'Days' };

  return (
    <div className="bg-white/10 border border-white/20 text-white p-5 rounded-xl shadow-sm backdrop-blur-sm w-full mb-4">
      <div className="flex items-center gap-2 mb-3 border-b border-white/20 pb-2">
        <Clock size={18} className="text-white" />
        <h3 className="font-bold text-sm">{labels.title}</h3>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {isRTL ? (
          <>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm shadow-inner">
              <span className="block text-xl font-bold font-mono">{timeLeft.seconds}</span>
              <span className="text-[10px] opacity-90">{labels.seconds}</span>
            </div>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm shadow-inner">
              <span className="block text-xl font-bold font-mono">{timeLeft.minutes}</span>
              <span className="text-[10px] opacity-90">{labels.minutes}</span>
            </div>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm shadow-inner">
              <span className="block text-xl font-bold font-mono">{timeLeft.hours}</span>
              <span className="text-[10px] opacity-90">{labels.hours}</span>
            </div>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm shadow-inner">
              <span className="block text-xl font-bold font-mono">{timeLeft.days}</span>
              <span className="text-[10px] opacity-90">{labels.days}</span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm shadow-inner">
              <span className="block text-xl font-bold font-mono">{timeLeft.days}</span>
              <span className="text-[10px] opacity-90">{labels.days}</span>
            </div>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm shadow-inner">
              <span className="block text-xl font-bold font-mono">{timeLeft.hours}</span>
              <span className="text-[10px] opacity-90">{labels.hours}</span>
            </div>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm shadow-inner">
              <span className="block text-xl font-bold font-mono">{timeLeft.minutes}</span>
              <span className="text-[10px] opacity-90">{labels.minutes}</span>
            </div>
            <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm shadow-inner">
              <span className="block text-xl font-bold font-mono">{timeLeft.seconds}</span>
              <span className="text-[10px] opacity-90">{labels.seconds}</span>
            </div>
          </>
        )}
      </div>

      <div className="mt-3 text-center text-xs bg-black/10 py-1.5 rounded text-white/90">
        {labels.deadline}
      </div>
    </div>
  );
};

export default CountdownTimer;