"use client";

import { Display } from "react-7-segment-display";
import { LAUNCH_DATE } from "@/constants";
import { useEffect, useState } from "react";

export default function ComingSoon() {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-black py-4 sm:py-8">
      <div className="flex flex-col items-center gap-y-6 sm:gap-y-12 w-full">
        <CountdownTimer />
        <div className="text-balance space-y-3 sm:space-y-6 text-green-500 w-[95%] sm:w-[90%] max-w-[600px] text-center">
          <p className="text-sm sm:text-xl terminal-text">
            Welcome to Higherrrrrrr, a new kind of meme token platform where your tokens visually evolve as 
            they increase in value. Create or trade tokens that automatically transform their names and 
            symbols through smart contracts as they hit different price milestones. It&apos;s a fun new way to 
            make meme tokens more interactive and engaging for communities.
          </p>
          <p className="text-sm sm:text-xl terminal-text">
            Early supporters who hold through price milestones will receive special Conviction NFTs 
            to commemorate their participation. Whether you want to launch your own evolving token or join 
            existing projects, Higherrrrrrr adds a new dimension to meme trading by making price action 
            visible in the token itself.
          </p>
        </div>
      </div>
    </div>
  );
}

function CountdownTimer() {
  const [timeTilLaunch, setTimeTilLaunch] = useState(
    LAUNCH_DATE.getTime() - new Date().getTime()
  );

  const hours = Math.floor(timeTilLaunch / (1000 * 60 * 60));
  const minutes = Math.floor((timeTilLaunch % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeTilLaunch % (1000 * 60)) / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTilLaunch(LAUNCH_DATE.getTime() - new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeTilLaunch <= 0) {
      window.location.href = "/";
    }
  }, [timeTilLaunch]);

  return (
    <div className="flex items-center gap-x-4 sm:gap-x-12">
      <DisplayWithLabel value={hours} label="hours" />
      <DisplayWithLabel value={minutes} label="minutes" />
      <DisplayWithLabel value={seconds} label="seconds" />
    </div>
  );
}

function DisplayWithLabel({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="block sm:hidden">
        <Display
          count={2}
          value={value}
          height={40}
          color="rgb(34 197 94)"
          skew={false}
        />
      </div>
      <div className="hidden sm:block">
        <Display
          count={2}
          value={value}
          height={80}
          color="rgb(34 197 94)"
          skew={false}
        />
      </div>
      <div className="text-xs sm:text-base text-green-500 -mt-2 sm:-mt-4 terminal-text">{label}</div>
    </div>
  );
}
