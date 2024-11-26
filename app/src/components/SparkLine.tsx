"use client";

import { useEffect, useId, useRef, useState } from "react";

interface SparkLineProps {
  data?: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function SparkLine({
  data = [],
  width = 200,
  height = 32,
  color = "rgb(34 197 94)"
}: SparkLineProps) {
  // Early return if no data
  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height}>
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={color}
          strokeOpacity={0.2}
        />
      </svg>
    );
  }

  // Normalize data
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const fullData = data.map((value) => {
    if (range === 0) return height / 2;
    return height - ((value - min) / range) * height;
  });

  // Generate path
  let sparkLinePath = `M 0 ${fullData[0] || height / 2}`;
  fullData.forEach((value, i) => {
    if (value === undefined) return;
    const x = (i / (data.length - 1)) * width;
    sparkLinePath += ` L ${x} ${value}`;
  });

  return (
    <svg width={width} height={height}>
      <path
        d={sparkLinePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
