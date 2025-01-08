import { useState, useEffect } from 'react';

export function useTypewriter(baseText, options = {}) {
  const {
    minRs = 3,
    maxRs = 8,
    typingSpeed = 300,
    deletingSpeed = 200,
  } = options;

  const [text, setText] = useState(baseText);
  const [direction, setDirection] = useState('adding');

  useEffect(() => {
    const interval = setInterval(() => {
      const baseWithoutRs = baseText.replace(/r+$/, '');
      const currentRs = text.match(/r+$/)?.[0]?.length || 0;
      
      if (currentRs >= maxRs) {
        setDirection('removing');
      } else if (currentRs <= minRs) {
        setDirection('adding');
      }

      if (direction === 'adding') {
        setText(baseWithoutRs + 'r'.repeat(currentRs + 1));
      } else {
        setText(baseWithoutRs + 'r'.repeat(currentRs - 1));
      }

    }, direction === 'adding' ? typingSpeed : deletingSpeed);

    return () => clearInterval(interval);
  }, [text, baseText, minRs, maxRs, typingSpeed, deletingSpeed, direction]);

  return text;
} 