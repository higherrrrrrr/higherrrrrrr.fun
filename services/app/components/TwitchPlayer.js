"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import streamers from '../data/streamers';

export default function TwitchPlayer() {
  const [currentChannel, setCurrentChannel] = useState(streamers[0]);
  const [showChannels, setShowChannels] = useState(false);
  const embedRef = useRef(null);
  const containerRef = useRef(null);

  const initializeEmbed = useCallback(() => {
    if (typeof window === 'undefined' || !window.Twitch) return;
    
    if (embedRef.current) {
      embedRef.current.destroy();
    }

    try {
      const embed = new window.Twitch.Embed("twitch-embed", {
        width: '100%',
        height: '100%',
        channel: currentChannel.twitchChannel,
        layout: "video-with-chat",
        theme: "dark",
        allowfullscreen: true,
        parent: ["localhost", "higherrrrrrr.fun"]
      });

      embed.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
        const player = embed.getPlayer();
        if (player && player.setQuality) {
          player.setQuality('auto');
        }
      });

      embedRef.current = embed;
    } catch (error) {
      // Silent fail - Twitch embed will show its own error UI
      embedRef.current = null;
    }
  }, [currentChannel.twitchChannel]);

  useEffect(() => {
    if (!containerRef.current) return;
    // Since script is loaded in layout, just initialize
    initializeEmbed();
  }, [initializeEmbed]);

  useEffect(() => {
    return () => {
      if (embedRef.current) {
        embedRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black" ref={containerRef}>
      <div id="twitch-embed" className="w-full h-full" />
      
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setShowChannels(!showChannels)}
          className="bg-black border border-green-500/30 text-green-500 
            px-4 py-2 rounded-lg font-mono hover:bg-green-500/20 
            transition-all duration-200"
        >
          {currentChannel.name} 📺
        </button>

        {showChannels && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-black 
            border border-green-500/30 rounded-lg overflow-hidden shadow-lg">
            {streamers.map((streamer) => (
              <button
                key={streamer.twitchChannel}
                onClick={() => {
                  setCurrentChannel(streamer);
                  setShowChannels(false);
                }}
                className={`w-full text-left px-4 py-2 font-mono
                  ${currentChannel.twitchChannel === streamer.twitchChannel
                    ? 'bg-green-500 text-black'
                    : 'text-green-500/50 hover:text-black hover:bg-green-500'
                  } transition-all duration-200`}
              >
                {streamer.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}