import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  language: 'ar' | 'en';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ language }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
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

  const blocks = isRTL
    ? [
        { value: timeLeft.seconds, label: labels.seconds },
        { value: timeLeft.minutes, label: labels.minutes },
        { value: timeLeft.hours, label: labels.hours },
        { value: timeLeft.days, label: labels.days },
      ]
    : [
        { value: timeLeft.days, label: labels.days },
        { value: timeLeft.hours, label: labels.hours },
        { value: timeLeft.minutes, label: labels.minutes },
        { value: timeLeft.seconds, label: labels.seconds },
      ];

  return (
    <div className="rounded-2xl p-4 mb-4"
      style={{
        background: 'rgba(200,16,46,0.08)',
        border: '1px solid rgba(200,16,46,0.25)',
      }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Clock size={16} className="text-[#C8102E]" />
        <h3 className="font-bold text-sm text-white">{labels.title}</h3>
      </div>

      {/* Time blocks */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {blocks.map((block, idx) => (
          <div key={idx} className="rounded-xl p-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="block text-xl font-bold font-mono text-white">
              {String(block.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-white/40">{block.label}</span>
          </div>
        ))}
      </div>

      {/* Deadline */}
      <div className="mt-3 text-center text-xs rounded-lg py-1.5"
        style={{ background: 'rgba(200,16,46,0.12)', color: 'rgba(255,255,255,0.5)' }}>
        {labels.deadline}
      </div>
    </div>
  );
};

export default CountdownTimer;