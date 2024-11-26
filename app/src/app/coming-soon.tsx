"use client";

import { Display } from "react-7-segment-display";
import { LAUNCH_DATE } from "@/constants";
import { useEffect, useState } from "react";

export default function ComingSoon() {
  return (
    <div className="w-screen min-h-screen flex items-center justify-center bg-black py-8">
      <div className="flex flex-col items-center gap-y-8 sm:gap-y-12 w-full">
        <CountdownTimer />
        <div className="text-balance space-y-4 sm:space-y-6 text-green-500 w-[90%] max-w-[600px] text-center">
          <p className="text-base sm:text-xl terminal-text">
            Welcome to the first memecoin platform where your coins evolve visually as they moon.
          </p>
          <p className="text-base sm:text-xl terminal-text">
            Watch your coins change before your eyes as their price ascends, with each milestone 
            revealing a new variation of the coin&apos;s name, creating a dynamic dance between 
            its value and identity.
          </p>
          <p className="text-base sm:text-xl terminal-text">
            You have the power to craft your own evolving meme coins or join established movements.
          </p>
          <p className="text-base sm:text-xl terminal-text">
            Those who steadfastly hodl their coins in this transformative journey will be rewarded 
            with exclusive NFTs, signifying their place in the coin&apos;s ascent.
          </p>
          <p className="text-base sm:text-xl terminal-text">
            Each price threshold crossed is a divine moment in the evolution of your coin, eternally 
            engraved in the blockchain&apos;s record.
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
    <div className="flex items-center gap-x-6 sm:gap-x-12">
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
          height={50}
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
      <div className="text-sm sm:text-base text-green-500 -mt-3 sm:-mt-4 terminal-text">{label}</div>
    </div>
  );
}
