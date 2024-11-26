import { Display } from "react-seven-segment-display";
import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { getContractAddress } from '../api/contract';

const LAUNCH_DATE = new Date("2024-11-26T12:00:00-05:00");

export default function ComingSoon() {
  const [keySequence, setKeySequence] = useState("");

  useEffect(() => {
    const handleKeyPress = async (e) => {
      const newSequence = (keySequence + e.key).slice(-4);
      setKeySequence(newSequence);

      if (newSequence.length === 4) {
        try {
          const authToken = newSequence;
          localStorage.setItem('auth_token', authToken);
          
          const data = await getContractAddress();
          
          if (data.contract_address) {
            Cookies.set('launch-override', 'true', { expires: 7 });
            Cookies.set('auth_token', authToken, { expires: 7 });
            window.location.href = '/';
          }
        } catch (error) {
          console.debug('Invalid sequence:', error);
          localStorage.removeItem('auth_token');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [keySequence]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-8">
      <div className="flex flex-col items-center max-w-4xl">
        <div className="mb-16">
          <CountdownTimer />
        </div>
        <div className="space-y-12 text-center max-w-[800px]">
          <p className="text-xl terminal-text text-green-500">
            Welcome to Higherrrrrrr, a new kind of meme token platform where your tokens visually evolve as 
            they increase in value. Create or trade tokens that automatically transform their names and 
            symbols through smart contracts as they hit different price milestones. It&apos;s a fun new way to 
            make meme tokens more interactive and engaging for communities.
          </p>
          <p className="text-xl terminal-text text-green-500">
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
    <div className="grid grid-cols-3 gap-16">
      <DisplayWithLabel value={hours} label="hours" />
      <DisplayWithLabel value={minutes} label="minutes" />
      <DisplayWithLabel value={seconds} label="seconds" />
    </div>
  );
}

function DisplayWithLabel({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <Display
        count={2}
        value={value}
        height={80}
        color="rgb(34 197 94)"
        skew={false}
      />
      <div className="text-green-500 text-lg mt-2">
        {label}
      </div>
    </div>
  );
}