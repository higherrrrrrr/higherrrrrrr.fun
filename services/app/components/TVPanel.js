"use client";

import { useState } from 'react';
import TwitchPlayer from './TwitchPlayer';
import MusicPlayer from './MusicPlayer';

export default function TVPanel() {
  const [mode, setMode] = useState('tv');

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black border-b border-green-500/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-green-500 text-lg font-bold font-mono">
              Higherrrrrrr TV
            </h2>
            <div className="text-green-500/60 text-sm font-mono">
              {mode === 'tv' ? 'Video Mode 📺' : 'Music Mode 🎵'}
            </div>
          </div>
          <button
            onClick={() => setMode(mode === 'tv' ? 'music' : 'tv')}
            className="text-green-500 hover:text-green-500/80 transition-all 
              px-4 py-2 border border-green-500/30 rounded hover:bg-green-500/10
              flex items-center gap-2"
          >
            <span>{mode === 'tv' ? '🎵' : '📺'}</span>
            <span className="font-mono">{mode === 'tv' ? 'Music' : 'Video'}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow">
        {mode === 'tv' ? <TwitchPlayer /> : <MusicPlayer />}
      </div>
    </div>
  );
}