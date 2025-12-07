'use client';

import React, { useEffect } from 'react';
import { Value, numericValue, formatValue } from '@/utils/comparisonGenerator';

type Props = {
  left: Value;
  right: Value;
  onChoice: (chosen: 'left' | 'right', isCorrect: boolean) => void;
};

export default function ComparisonPair({ left, right, onChoice }: Props) {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') choose('left');
    if (e.key === 'ArrowRight') choose('right');
  };

  const choose = (side: 'left' | 'right') => {
    const leftNum = numericValue(left);
    const rightNum = numericValue(right);
    const isCorrect = leftNum > rightNum ? side === 'left' : side === 'right';
    onChoice(side, isCorrect);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className="flex items-center gap-10 text-4xl font-semibold">
      <div className="p-4 border rounded-xl">{formatValue(left)}</div>
      <span className="text-3xl">vs</span>
      <div className="p-4 border rounded-xl">{formatValue(right)}</div>
    </div>
  );
}
