"use client";

import { Display } from "react-7-segment-display";
import { LAUNCH_DATE } from "@/constants";
import { useEffect, useState } from "react";

export default function ComingSoon() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-y-8">
        <CountdownTimer />
        <div className="max-w-xl text-balance space-y-4 px-8">
          <p className="text-lg">
            Welcome to the first meme coin platform where your assets evolve
            visually as they moon. Watch your investments transform in real-time
            as prices climb - each milestone unlocks new variations of your
            token&apos;s name, creating a dynamic connection between value and
            its identity.
          </p>
          <p className="text-lg">
            Create your own evolving meme coins or join existing movements.
            Early believers who HODL through the transformative journey will be
            rewarded with exclusive NFTs marking their role in each coin&apos;s
            ascension. Every price threshold crossed isn&apos;t just a number -
            it&apos;s a new era in your token&apos;s evolution, permanently
            etched into the blockchain.
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
    <div className="flex items-center">
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
          height={100}
          color="rgb(34 197 94)"
          skew={false}
        />
      </div>
      <div className="text-lg text-green-500 -mt-8">{label}</div>
    </div>
  );
}
