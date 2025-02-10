'use client';
import { useEffect, useState } from 'react';

const YE_URL = "/api/ye"; // Updated to use our API route
const POLLING_INTERVAL = 5000;

function Stats({ stats }) {
  const [runningTime, setRunningTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRunningTime(Math.floor((Date.now() - stats.startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [stats.startTime]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="bg-black/50 p-4 rounded-lg border border-green-500/30">
      <h2 className="text-xl mb-4 text-green-400">📊 Stats Summary</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>✓ Checks performed: <span className="text-green-400">{stats.checksPerformed}</span></div>
        <div>⏱️ Running for: <span className="text-green-400 tabular-nums">{formatTime(runningTime)}</span></div>
        <div>🔗 Total links found: <span className="text-green-400">{stats.allLinks.size}</span></div>
        <div>⚡ Discord links: <span className="text-green-400">{stats.discordLinks.length}</span></div>
        <div>📡 Last status: <span className={stats.lastStatus === 200 ? "text-green-400" : "text-red-400"}>
          {stats.lastStatus}
        </span></div>
      </div>
    </div>
  );
}

function DiscordLink({ link, serverInfo }) {
  return (
    <div className="bg-black/30 p-4 rounded-lg border-2 border-yellow-500 mb-4 animate-pulse">
      <div className="text-xl mb-2 text-yellow-500 font-bold">
        🚨 DISCORD LINK FOUND! 🚨
      </div>
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-yellow-400 break-all font-bold text-lg hover:underline"
      >
        {link}
      </a>
      {serverInfo && (
        <div className="mt-2">
          <div>📝 Server: {serverInfo.name || 'Unknown'}</div>
          <div>👥 Members: {serverInfo.memberCount || 'Unknown'}</div>
        </div>
      )}
    </div>
  );
}

function LinksList({ links, discordLinks }) {
  const discordSet = new Set(discordLinks);
  
  return (
    <div className="bg-black/30 p-4 rounded-lg border border-green-500/30">
      <h3 className="text-lg mb-4">🔗 All Links ({links.size})</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Array.from(links).map((link, i) => {
          const isDiscord = discordSet.has(link) || 
            link.toLowerCase().includes('discord') || 
            link.toLowerCase().includes('dsc.gg') ||
            link.toLowerCase().includes('dis.gd');
          return (
            <div 
              key={i} 
              className={`p-2 rounded ${
                isDiscord 
                  ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400 font-bold' 
                  : 'hover:bg-green-500/10'
              }`}
            >
              {isDiscord && '⚡ '}
              <a 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="break-all hover:underline"
              >
                {link}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function YePage() {
  const [stats, setStats] = useState({
    checksPerformed: 0,
    startTime: Date.now(),
    lastStatus: 0,
    discordLinks: [],
    allLinks: new Set(),
  });

  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  async function checkPage() {
    try {
      const response = await fetch(YE_URL);
      const html = await response.text();
      
      setStats(prev => ({
        ...prev,
        checksPerformed: prev.checksPerformed + 1,
        lastStatus: response.status
      }));

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Collect all links and potential Discord content
      const allLinks = new Set();
      const discordContent = new Set();

      // Check all elements for Discord-related content
      doc.querySelectorAll('*').forEach(el => {
        // Check text content
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('discord')) {
          discordContent.add(el.textContent);
        }

        // Check attributes
        Array.from(el.attributes).forEach(attr => {
          const value = attr.value.toLowerCase();
          if (value.startsWith('http')) {
            allLinks.add(attr.value);
          }
          if (value.includes('discord')) {
            discordContent.add(attr.value);
          }
        });

        // Check href attributes specifically
        if (el.tagName === 'A' && el.hasAttribute('href')) {
          const href = el.getAttribute('href');
          if (href.startsWith('http')) {
            allLinks.add(href);
          } else if (href.startsWith('/')) {
            allLinks.add(`https://yeezy.com${href}`);
          }
        }
      });

      // Check for Discord links with broader patterns
      const discordPatterns = [
        /(?:https?:\/\/)?discord(?:app)?\.(?:com\/invite|gg)\/[a-zA-Z0-9]+\/?/,
        /discord\.gg\/\S+/,
        /discord\.com\/invite\/\S+/,
        /dsc\.gg\/\S+/,
        /dis\.gd\/\S+/,
        /discord\S*\.(?:com|gg|io)\/\S+/,
        /invite\.gg\/\S+/
      ];

      const foundDiscordLinks = new Set();
      
      // Check both HTML and collected Discord content
      [...discordContent, html].forEach(content => {
        discordPatterns.forEach(pattern => {
          const matches = content.match(pattern) || [];
          matches.forEach(link => {
            foundDiscordLinks.add(link);
            allLinks.add(link);
          });
        });
      });

      // Also check for potential obfuscated Discord links
      const potentialInviteCodes = Array.from(discordContent)
        .join(' ')
        .match(/(?<![a-zA-Z0-9])[a-zA-Z0-9]{7,10}(?![a-zA-Z0-9])/g) || [];

      potentialInviteCodes.forEach(code => {
        const potentialLink = `discord.gg/${code}`;
        foundDiscordLinks.add(potentialLink);
        allLinks.add(potentialLink);
      });

      setStats(prev => ({
        ...prev,
        discordLinks: [...foundDiscordLinks],
        allLinks: new Set([...prev.allLinks, ...allLinks])
      }));

    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(checkPage, POLLING_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl">🚀 YE Discord Scanner</h1>
          <button 
            onClick={() => setIsScanning(prev => !prev)}
            className="px-4 py-2 border border-green-500 rounded hover:bg-green-500/20"
          >
            {isScanning ? '⏸️ Pause' : '▶️ Resume'}
          </button>
        </div>

        <Stats stats={stats} />

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            ❌ Error: {error}
          </div>
        )}

        <div className="mt-8 space-y-8">
          {stats.discordLinks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl text-yellow-500">⚡ Discord Links Found!</h2>
              {stats.discordLinks.map((link, i) => (
                <DiscordLink key={i} link={link} />
              ))}
            </div>
          )}
          
          <LinksList links={stats.allLinks} discordLinks={stats.discordLinks} />
        </div>
      </div>
    </div>
  );
}