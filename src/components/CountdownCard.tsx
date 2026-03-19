import React from 'react';
import CountdownTimer from './CountdownTimer';

interface CountdownCardProps {
  language: 'ar' | 'en';
}

const CountdownCard: React.FC<CountdownCardProps> = ({ language }) => {
  return (
    <div className="mb-4">
      <CountdownTimer language={language} />
    </div>
  );
};

export default CountdownCard;