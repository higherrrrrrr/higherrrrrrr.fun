// components/TVPanel.js

import { useState, useEffect } from 'react';
import { Timeline } from 'react-twitter-widgets';
import featuredProjects from '../data/featuredProjects';
import Link from 'next/link';

/**
 * TVPanel: Shows a Twitch stream (by channel name) plus
 * a Twitter timeline (by Twitter screen name).
 *
 * You can style or expand this as desired.
 */
export default function TVPanel() {
  const defaultChannel = featuredProjects.find(p => p.slug === 'cult').tvChannel;
  const [currentChannel, setCurrentChannel] = useState(defaultChannel);
  const [embedInstance, setEmbedInstance] = useState(null);

  useEffect(() => {
    let mounted = true;

    // Cleanup previous embed if it exists
    if (embedInstance) {
      embedInstance.destroy();
    }

    // Load the Twitch embed script
    const script = document.createElement('script');
    script.src = "https://embed.twitch.tv/embed/v1.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (!mounted) return;

      const embed = new window.Twitch.Embed("twitch-embed", {
        width: '100%',
        height: '100%',
        channel: currentChannel.twitchChannel,
        layout: "video-with-chat",
        autoplay: false,
        parent: ["higherrrrrrr.fun"]
      });

      setEmbedInstance(embed);
    };

    return () => {
      mounted = false;
      document.body.removeChild(script);
      if (embedInstance) {
        embedInstance.destroy();
      }
    };
  }, [currentChannel]);

  return (
    <div className="bg-black border border-green-500/30 rounded-lg overflow-hidden flex flex-col h-full">
      {/* TV Title & Channel Info */}
      <div className="p-4 border-b border-green-500/30">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-green-500 text-lg font-bold font-mono">Higherrrrrrr TV</h2>
          <span className="text-green-500/70 text-sm font-mono">CH {currentChannel.number}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-green-500/60 text-sm font-mono">
            {currentChannel.name}
          </div>
          <Link 
            href={`/featured/${currentChannel.projectSlug}`}
            className="text-green-500/30 hover:text-green-500/60 text-xs font-mono transition-colors"
          >
            view project →
          </Link>
        </div>
      </div>

      {/* Twitch Player with Chat */}
      <div className="flex-grow">
        <div className="w-full h-full">
          <div id="twitch-embed" className="w-full h-full" />
        </div>
      </div>

      {/* Channel Guide */}
      <div className="p-4 border-t border-green-500/30 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-green-500 text-sm font-bold">CHANNEL GUIDE</h3>
        </div>
        
        <div className="space-y-2">
          {featuredProjects
            .filter(p => p.tvChannel)
            .map(project => (
              <button
                key={project.tvChannel.number}
                onClick={() => setCurrentChannel(project.tvChannel)}
                className={`w-full text-left p-2 rounded ${
                  currentChannel.number === project.tvChannel.number
                    ? 'bg-green-500/20 text-green-500'
                    : 'text-green-500/70 hover:bg-green-500/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono">
                    {project.tvChannel.number} - {project.tvChannel.name}
                  </span>
                  <span className="text-xs opacity-70">
                    {project.name}
                  </span>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
