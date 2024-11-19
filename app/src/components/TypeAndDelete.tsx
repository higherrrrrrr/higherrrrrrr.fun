"use client";

import { useLayoutEffect, useState } from "react";

type Props = {
  words: string[];
  timeBetweenChars?: number;
};

export function TypeAndDelete({ words, timeBetweenChars = 200 }: Props) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [charCount, setCharCount] = useState(1);

  const word = words[wordIndex];
  const textToShow = word.slice(0, charCount);

  useLayoutEffect(() => {
    let timeoutId: NodeJS.Timeout;
    function sleep(ms: number) {
      return new Promise((resolve) => {
        timeoutId = setTimeout(resolve, ms);
      });
    }

    async function go() {
      for (let i = 1; i < word.length; i++) {
        await sleep(timeBetweenChars);
        setCharCount(i + 1);
      }

      for (let i = word.length; i > 1; i--) {
        await sleep(timeBetweenChars);
        setCharCount(i - 1);
      }

      // need this to trigger the useEffect even if the word hasn't changed
      setCount((count) => count + 1);

      setWordIndex((index) => (index + 1) % words.length);
    }

    go();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [word, count, timeBetweenChars, words.length]);

  return (
    <span>
      {textToShow}
      <span className="text-green-200">|</span>
    </span>
  );
}
