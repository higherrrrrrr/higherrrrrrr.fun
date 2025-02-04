"use client";

import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import featuredProjects from '../../../data/featuredProjects';
import { FaGlobe, FaTelegramPlane } from 'react-icons/fa';
import { GlitchText } from '../../../components/GlitchText';

/* Simple X (Twitter) icon */
const XIcon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/* Helper to format the countdown string */
function formatCountdown(msLeft) {
  if (msLeft <= 0) return 'Launched!';

  const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((msLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((msLeft / 1000) % 60);

  const timeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  
  return (
    <span className="group relative inline-block">
      {timeStr}
      <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-black border border-green-500/30 rounded-lg shadow-lg text-xs text-green-500/80 z-10">
        Launch times may be adjusted by project creators based on market conditions. Changes by the Higherrrrrrr team will be clearly communicated.
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black border-r border-b border-green-500/30 rotate-45"></div>
      </div>
    </span>
  );
}

export default function FeaturedProjectPage() {
  const params = useParams();
  const slug = params.slug;

  // Find the matching project
  const project = featuredProjects.find((p) => p.slug === slug);

  // Local countdown state
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  // 1) Compute initial time left
  useEffect(() => {
    if (!project) return;
    const launchTime = new Date(project.launchDate).getTime();
    const nowMs = Date.now();
    setTimeLeftMs(Math.max(launchTime - nowMs, 0));
  }, [project]);

  // 2) Update countdown every second
  useEffect(() => {
    if (!project) return;

    const timer = setInterval(() => {
      setTimeLeftMs((prev) => (prev <= 1000 ? 0 : prev - 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [project]);

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p className="text-green-500/60 mt-2">
            This project may have been removed or does not exist.
          </p>
        </div>
      </div>
    );
  }

  // Format countdown
  const countdownStr = formatCountdown(timeLeftMs);

  return (
    <>
      <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col">
        {/* Hero Section */}
        <div className="p-6 md:p-12 relative overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <GlitchText className="text-4xl md:text-5xl font-bold mb-3">
              {project.name}
            </GlitchText>

            {/* Description */}
            <p className="text-green-500/80 max-w-2xl mb-6">
              {project.description}
            </p>

            {/* Social Icons => Website, X, Telegram */}
            <div className="flex space-x-6">
              {project.website && (
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-3 rounded-full
                             border border-green-500/60 hover:bg-green-500 hover:text-black transition-colors"
                >
                  <FaGlobe className="text-xl" />
                </a>
              )}
              {project.twitter && (
                <a
                  href={project.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-3 rounded-full
                             border border-green-500/60 hover:bg-green-500 hover:text-black transition-colors"
                >
                  <XIcon className="text-xl w-5 h-5" />
                </a>
              )}
              {project.telegram && (
                <a
                  href={project.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-3 rounded-full
                             border border-green-500/60 hover:bg-green-500 hover:text-black transition-colors"
                >
                  <FaTelegramPlane className="text-xl" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-16">
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-16">
              {/* Image with constant snake border */}
              {project.imageUrl && (
                <div className="snake-border p-4 bg-black/20 rounded">
                  <div className="snake-line"></div>
                  <img
                    src={project.imageUrl}
                    alt={project.name}
                    className="w-full max-w-md object-cover rounded"
                  />
                </div>
              )}

              {/* Countdown box with constant snake border */}
              <div className="snake-border bg-black/20 rounded">
                <div className="snake-line"></div>
                <div className="flex flex-col items-center md:items-start p-8">
                  <h2 className="text-2xl font-bold text-green-400 mb-4">
                    Launch Countdown
                  </h2>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl text-green-400 font-bold font-mono">
                      {countdownStr}
                    </p>
                    {/* Info icon with tooltip */}
                    <div className="group">
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
              </div>
            </div>

            {/* Custom content */}
            {project.customContent && (
              <div className="mt-16 text-green-500/80 leading-relaxed space-y-4">
                {typeof project.customContent === 'string' ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: project.customContent }}
                  />
                ) : (
                  project.customContent
                )}
              </div>
            )}

            {/* Project Details - Icons only */}
            <div className="mt-16 border-t border-green-500/20 pt-6">
              <h2 className="text-xl font-bold mb-4">Project Details</h2>
              <div className="flex items-center justify-start gap-16">
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 transition-colors"
                    aria-label="Website"
                  >
                    <FaGlobe className="w-5 h-5" />
                  </a>
                )}
                
                {project.twitter && (
                  <a
                    href={project.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 transition-colors"
                    aria-label="X"
                  >
                    <XIcon className="w-5 h-5" />
                  </a>
                )}
                
                {project.telegram && (
                  <a
                    href={project.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 transition-colors"
                    aria-label="Telegram"
                  >
                    <FaTelegramPlane className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black border-t border-green-500/30 py-6">
          <div className="max-w-4xl mx-auto px-4 md:px-8 text-center text-green-500/70">
            <p className="text-sm">
              © {new Date().getFullYear()} Higher⁷ |{' '}
              <span className="ml-2">Stay degen, frens.</span>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}