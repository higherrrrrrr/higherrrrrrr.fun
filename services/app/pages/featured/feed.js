// pages/featured/feed.js

import { useState, useEffect } from 'react';
import Link from 'next/link';
import featuredProjects from '../../data/featuredProjects';

/*
  1) Glitch text CSS:
     - display: inline-block so the glitch text overlays precisely
     - top: 0 for pseudo-elements to match the main text's baseline
*/
const glitchStyles = `
  .glitch {
    position: relative;
    display: inline-block; /* ensures text & glitch line up exactly */
    color: #00ff00;
    text-shadow: 0 0 2px #00ff00;
    line-height: 1; /* remove extra spacing if needed */
  }
  .glitch::before,
  .glitch::after {
    content: attr(data-text);
    position: absolute;
    left: 0;
    top: 0; /* align glitch layers directly over main text */
    overflow: hidden;
    clip: rect(0, 900px, 0, 0);
    opacity: 0.9;
  }
  .glitch::before {
    color: #0ff;
    animation: glitch-top 2s infinite linear alternate-reverse;
  }
  .glitch::after {
    color: #f0f;
    animation: glitch-bottom 2s infinite linear alternate-reverse;
  }
  @keyframes glitch-top {
    0%   { clip: rect(0, 9999px, 0, 0);    transform: translate(2px, -2px); }
    20%  { clip: rect(15px, 9999px, 16px, 0); transform: translate(-2px, 0); }
    40%  { clip: rect(5px, 9999px, 40px, 0);  transform: translate(-2px, -2px); }
    60%  { clip: rect(30px, 9999px, 10px, 0); transform: translate(0, 2px); }
    80%  { clip: rect(10px, 9999px, 30px, 0); transform: translate(2px, -1px); }
    100% { clip: rect(8px, 9999px, 14px, 0);  transform: translate(-1px, 2px); }
  }
  @keyframes glitch-bottom {
    0%   { clip: rect(55px, 9999px, 56px, 0); transform: translate(-2px, 0); }
    20%  { clip: rect(30px, 9999px, 34px, 0); transform: translate(-1px, 2px); }
    40%  { clip: rect(10px, 9999px, 90px, 0); transform: translate(-1px, -1px); }
    60%  { clip: rect(40px, 9999px, 60px, 0); transform: translate(1px, 2px); }
    80%  { clip: rect(20px, 9999px, 50px, 0); transform: translate(0, 1px); }
    100% { clip: rect(70px, 9999px, 80px, 0); transform: translate(2px, -2px); }
  }
`;

/*
  2) Helper function to format the countdown string 
     (e.g. "3d 12h 25m 42s") or "Launched!"
*/
function formatCountdown(msLeft) {
  if (msLeft <= 0) return 'Launched!';

  const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((msLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((msLeft / 1000) % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export default function FeaturedFeed() {
  const [projects, setProjects] = useState([]);

  // Sort by ascending launch date on mount
  useEffect(() => {
    const sorted = [...featuredProjects].sort(
      (a, b) => new Date(a.launchDate) - new Date(b.launchDate)
    );

    const nowMs = Date.now();
    const mapped = sorted.map((p) => {
      const launchMs = new Date(p.launchDate).getTime();
      const diff = Math.max(launchMs - nowMs, 0);
      return {
        ...p,
        timeLeftMs: diff,
      };
    });

    setProjects(mapped);
  }, []);

  // 3) Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.timeLeftMs <= 0) {
            // Already launched
            return { ...proj, timeLeftMs: 0 };
          }
          // Subtract 1 second
          const newTime = proj.timeLeftMs - 1000;
          return { ...proj, timeLeftMs: Math.max(newTime, 0) };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{glitchStyles}</style>
      <style>
        {`
          .hero-bg {
            background: linear-gradient(
              135deg, 
              rgba(0,128,0,0.2), 
              rgba(0,0,0,0.7) 70%
            );
          }
        `}
      </style>

      <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col">
        {/* HERO SECTION */}
        <div className="hero-bg p-6 md:p-12 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            {/* Glitch heading => inline-block so everything lines up exactly */}
            <h1
              className="glitch text-3xl md:text-4xl font-bold mb-3"
              data-text="Featured Projects"
            >
              Featured Projects
            </h1>
            <p className="text-green-500/80 max-w-2xl mx-auto">
              Explore our upcoming and recent launches—stay degen, fren.
            </p>
          </div>
        </div>

        {/* MAIN CONTENT: Project Feed */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 w-full">
          <div className="grid gap-6">
            {projects.map((project) => {
              const countdownStr = formatCountdown(project.timeLeftMs);

              return (
                <Link key={project.slug} href={`/featured/${project.slug}`}>
                  <div
                    className="
                      border border-green-500/30 rounded-lg p-4
                      transition-transform transition-colors cursor-pointer
                      hover:border-green-500 hover:scale-[1.02]
                      flex flex-col gap-4
                    "
                  >
                    {/* Image + text */}
                    <div className="flex items-start gap-4">
                      {project.imageUrl && (
                        <img
                          src={project.imageUrl}
                          alt={project.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h2 className="text-xl font-bold">{project.name}</h2>
                        <p className="text-sm text-green-500/70">
                          {project.description}
                        </p>
                      </div>
                    </div>

                    {/* Countdown text: bold & bright */}
                    <div className="mt-1 text-green-300 font-bold text-sm">
                      <span className="mr-2">Launch:</span>
                      {countdownStr}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
