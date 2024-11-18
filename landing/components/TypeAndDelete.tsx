import { interval } from "date-fns";
import { useEffect, useState } from "react";

export function TypeAndDelete({ text }: { text: string }) {
  const [charCount, setCharCount] = useState(1);

  useEffect(() => {
    let hasLooped = false;
    let timeoutDuration = 200;
    let timeoutId: NodeJS.Timeout;
    let direction = 1;

    function go() {
      setCharCount((count) => {
        if (count === text.length) {
          direction = -1;
        }

        if (count === 1) {
          if (hasLooped) {
            timeoutDuration = 1000;
          }

          direction = 1;
          hasLooped = true;
        }

        return count + direction;
      });

      timeoutId = setTimeout(() => {
        go();
      }, timeoutDuration);
    }

    go();

    return () => clearTimeout(timeoutId);
  }, [text.length]);

  return (
    <span className="text-green-600">
      {text.slice(0, charCount)}
      <span className="text-white">|</span>
    </span>
  );
}
