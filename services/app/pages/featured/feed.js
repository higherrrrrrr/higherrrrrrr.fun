// pages/featured/feed.js

import { useState, useEffect } from 'react';
import Link from 'next/link';
import featuredProjects from '../../data/featuredProjects';
import { GlitchText } from '../../components/GlitchText';
import { formatCountdown } from '../../utils/formatters';

/*
  1) Helper function to format the countdown string 
     (e.g. "3d 12h 25m 42s") or "Launched!"
*/

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
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* HERO SECTION */}
      <div className="p-6 md:p-12 relative overflow-hidden bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <GlitchText>Featured Projects</GlitchText>
          </h1>
          <p className="text-green-500/80 max-w-2xl mx-auto">
            Explore our upcoming and recent launches—stay degen, fren.
          </p>
        </div>
      </div>

      {/* DISCLAIMER BANNER */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-4">
        <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-4">
          <p className="text-sm text-green-500/80 text-center">
            ⚠️ Launch countdowns are managed by project creators and may be adjusted based on market conditions or other factors at their discretion. Rarely launches will be rescheduled by the Higherrrrrrrr team and those will be clearly communicated.
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
                <div className="snake-border p-6 bg-black/20">
                  <div className="snake-line"></div>
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

                  {/* Countdown text */}
                  <div className="mt-1 text-green-300 font-bold text-sm flex items-center gap-2">
                    <span className="mr-2">Launch:</span>
                    {countdownStr}
                    {/* Info icon with tooltip */}
                    <div className="group relative">
                      <div className="cursor-help text-green-500/70 hover:text-green-500 transition-colors text-base">
                        ℹ
                      </div>
                      <div className="invisible group-hover:visible absolute bottom-full right-0 mb-2 w-64 p-3 bg-black border border-green-500/30 rounded-lg shadow-lg text-xs text-green-500/80 z-10">
                        Launch times may be adjusted by project creators based on market conditions. Changes by the Higherrrrrrr team will be clearly communicated.
                        <div className="absolute -bottom-1 right-3 w-2 h-2 bg-black border-r border-b border-green-500/30 transform rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
