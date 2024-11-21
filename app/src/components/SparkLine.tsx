"use client";

import { useEffect, useId, useRef, useState } from "react";

type SparkLineProps = {
  data: number[];
};

export function SparkLine({ data }: SparkLineProps) {
  const [width, setWidth] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Create resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    // Get the wrapper element and observe it
    const wrapper = wrapperRef.current;
    if (wrapper) {
      resizeObserver.observe(wrapper);
    }

    // Cleanup observer on unmount
    return () => {
      if (wrapper) {
        resizeObserver.unobserve(wrapper);
      }
    };
  }, []);

  const lowest = Math.min(...data);
  const highest = Math.max(...data);
  const range = highest - lowest;

  const fullData = Array(24).fill(undefined);
  const startIndex = 24 - data.length;
  data.forEach((value, index) => {
    fullData[startIndex + index] = value;
  });

  let sparkLinePath = `M 0 32`;
  fullData.forEach((value, i) => {
    if (value === undefined) return;
    const x = (i / 23) * width;
    const y = 32 - ((value - lowest) / range) * 32;
    sparkLinePath += ` L ${x} ${y}`;
  });
  sparkLinePath += ` L ${width} 32 L 0 32`;

  let linePath = `M 0 32`;
  fullData.forEach((value, i) => {
    if (value === undefined) return;
    const x = (i / 23) * width;
    const y = 32 - ((value - lowest) / range) * 32;
    linePath += ` ${i == 0 ? "M" : "L"} ${x} ${y}`;
  });

  const gradientId = useId();

  const areWeGoingHigher = data[data.length - 1] > data[0];
  const gradientColor = areWeGoingHigher ? "#22c55e" : "#ef4444";

  return (
    <div ref={wrapperRef} className="max-w-full w-full h-[32px] relative">
      <svg
        width={width}
        height="32"
        preserveAspectRatio="none"
        className="absolute"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={gradientColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={sparkLinePath} fill={`url(#${gradientId})`} strokeWidth="0" />
        <path
          d={linePath}
          fill="none"
          stroke={gradientColor}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
