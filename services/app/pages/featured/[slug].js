// pages/featured/[slug].js

import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import featuredProjects from '../../data/featuredProjects';
import { FaGlobe, FaTelegramPlane } from 'react-icons/fa';

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

/* 
  Glitch text CSS (same snippet) 
*/
const glitchStyles = `
  .glitch {
    position: relative;
    color: #00ff00;
    text-shadow: 0 0 2px #00ff00;
  }
  .glitch::before,
  .glitch::after {
    content: attr(data-text);
    position: absolute;
    left: 0;
    overflow: hidden;
    clip: rect(0, 900px, 0, 0);
    opacity: 0.9;
  }
  .glitch::before {
    animation: glitch-top 2s infinite linear alternate-reverse;
    color: #0ff;
  }
  .glitch::after {
    animation: glitch-bottom 2s infinite linear alternate-reverse;
    color: #f0f;
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

/* Helper to format the countdown string */
function formatCountdown(msLeft) {
  if (msLeft <= 0) return 'Launched!';

  const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((msLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((msLeft / 1000) % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export default function FeaturedProjectPage() {
  const router = useRouter();
  const { slug } = router.query;

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
      <style>{glitchStyles}</style>
      <style>
        {`
          /* Hero gradient */
          .hero-bg {
            background: linear-gradient(
              135deg, 
              rgba(0,128,0,0.2), 
              rgba(0,0,0,0.7) 70%
            );
          }

          /* Pulsing neon border for the image */
          .neon-border {
            border: 2px solid #00ff00;
            border-radius: 8px;
            padding: 4px;
            animation: pulseGlow 2s infinite alternate;
          }
          @keyframes pulseGlow {
            0% {
              box-shadow: 0 0 5px #0f0, inset 0 0 5px #0f0;
            }
            100% {
              box-shadow: 0 0 15px #0f0, inset 0 0 15px #0f0;
            }
          }

          /* Animated neon border */
          .neon-border-animated {
            position: relative;
            border-radius: 8px;
            padding: 4px;
          }

          .neon-border-animated::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 2px solid #00ff00;
            border-radius: 8px;
            animation: borderMove 4s linear infinite;
            box-shadow: 0 0 15px #0f0;
          }

          /* Timer box specific styles */
          .timer-box {
            padding: 1rem;
            width: 200px;
            min-width: 200px;
            background: rgba(0, 0, 0, 0.3); /* Optional: slight background to help text stand out */
          }

          @keyframes borderMove {
            0% {
              clip-path: inset(0 98% 0 0);
            }
            25% {
              clip-path: inset(0 0 98% 0);
            }
            50% {
              clip-path: inset(0 0 0 98%);
            }
            75% {
              clip-path: inset(98% 0 0 0);
            }
            100% {
              clip-path: inset(0 98% 0 0);
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col">
        {/* Hero Section */}
        <div className="p-6 md:p-12 relative overflow-hidden">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            {/* Glitch Title */}
            <h1
              className="text-4xl md:text-5xl font-bold mb-3 glitch"
              data-text={project.name}
            >
              {project.name}
            </h1>

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
            {/* Row: left = image, right = timer neon box */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-16">
              {/* Neon image */}
              {project.imageUrl && (
                <div className="neon-border-animated">
                  <img
                    src={project.imageUrl}
                    alt={project.name}
                    className="w-full max-w-md object-cover rounded"
                  />
                </div>
              )}

              {/* Countdown box */}
              <div className="neon-border-animated timer-box flex flex-col items-center md:items-start">
                <h2 className="text-2xl font-bold text-green-400 mb-2">
                  Launch Countdown
                </h2>
                <p className="text-2xl text-green-400 font-bold font-mono">
                  {countdownStr}
                </p>
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