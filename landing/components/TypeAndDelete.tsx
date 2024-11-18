import { useEffect, useState } from "react";

type Props = {
  words: string[];
};

const timeBetweenChars = 200;

export function TypeAndDelete({ words }: Props) {
  const [count, setCount] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [charCount, setCharCount] = useState(1);

  let word = words[wordIndex];
  let textToShow = word.slice(0, charCount);

  useEffect(() => {
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
  }, [word, count]);

  return (
    <span>
      {textToShow}
      <span className="text-white">|</span>
    </span>
  );
}
