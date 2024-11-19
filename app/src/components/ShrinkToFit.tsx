"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  children: string;
  className?: string;
};

export function ShrinkToFit({ children, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      const container = containerRef.current;
      const text = textRef.current;

      if (!container || !text) return;

      const containerWidth = container.offsetWidth;
      const textWidth = text.scrollWidth;

      if (textWidth > containerWidth) {
        const newScale = containerWidth / textWidth;
        setScale(newScale);
      } else {
        setScale(1);
      }
    }

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, [children]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <div
        ref={textRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "left",
          whiteSpace: "nowrap",
          width: "fit-content",
        }}
      >
        {children}
      </div>
    </div>
  );
}
