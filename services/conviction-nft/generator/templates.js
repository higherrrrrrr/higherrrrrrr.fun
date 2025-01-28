const config = require('./config');

// Helper functions for visual effects
const getColorScheme = (level) => ({
  title: {
    start: '#FF3AF7',
    mid: level > 10 ? '#FF00EA' : '#FF8500',
    end: level > 15 ? '#00FFC0' : '#ADFF2F'
  },
  border: {
    primary: level > 10 ? '#FF00EA' : '#00FFC0',
    secondary: level > 15 ? '#FF3AF7' : '#FFFF00'
  }
});

const getLayout = (level) => ({
  cardPadding: 10 + Math.floor(level/5),
  borderRadius: 20 + Math.floor(level/3),
  strokeWidth: 4 + (level * 0.2),
  glowIntensity: 1 + (level * 0.15),
  eyeSize: {
    rx: 12,
    ry: 25,
    rotation: level > 10
  },
  background: {
    turbulence: 0.02 + (level * 0.001),
    opacity: Math.max(0.3, 0.9 - (level * 0.02))
  },
  glow: {
    intensity: 4 + (level * 0.5),
    opacity: 0.3 + (level * 0.02)
  },
  stars: {
    count: 30,
    minSize: 0.5,
    maxSize: 1.5,
    maxOpacity: 0.8
  }
});

const getEvolutionEffects = (level) => {
  const colors = getColorScheme(level);
  const layout = getLayout(level);

  return `
    <defs>
      <filter id="rainbowBG" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="${layout.background.turbulence}"
          numOctaves="${1 + Math.floor(level/5)}"
          seed="${8 + level}"
          result="noiseBase"
        />
        <feColorMatrix
          in="noiseBase"
          type="hueRotate"
          values="0"
          result="colorSwirl"
        >
          <animate
            attributeName="values"
            from="0"
            to="360"
            dur="${7 - (level * 0.2)}s"
            repeatCount="indefinite"
          />
        </feColorMatrix>
        <feColorMatrix
          in="colorSwirl"
          type="matrix"
          values="
            ${1.2 + (level * 0.05)} 0   0   0   0
            0   ${1.2 + (level * 0.05)} 0   0   0
            0   0   ${1.2 + (level * 0.05)} 0   0
            0   0   0   ${layout.background.opacity}   0
          "
          result="enhancedSwirl"
        />
        <feBlend in="SourceGraphic" in2="enhancedSwirl" mode="overlay"/>
      </filter>

      <filter id="intenseNeonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow 
          dx="0" dy="0"
          stdDeviation="${8 + (level * 0.5)}"
          flood-color="${level > 10 ? '#FF00EA' : '#22C55E'}"
          flood-opacity="${0.8 + (level * 0.02)}"
        />
      </filter>

      <radialGradient id="eyeGrad">
        <stop offset="0%" stop-color="#FFF"/>
        <stop offset="33%" stop-color="${level > 15 ? '#FF00FF' : '#FF00EA'}"/>
        <stop offset="66%" stop-color="${level > 10 ? '#00FFFF' : '#00FFEA'}"/>
        <stop offset="100%" stop-color="${level > 5 ? '#FF3AF7' : '#ADFF2F'}"/>
      </radialGradient>

      <filter id="neonBoxGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${layout.glow.intensity}"/>
        <feColorMatrix
          type="matrix"
          values="
            0 0 0 0 0
            0 1 0 0 0
            0 0 0 0 0
            0 0 0 ${layout.glow.opacity} 0
          "
        />
        <feBlend in="SourceGraphic" in2="blurOut" mode="screen"/>
      </filter>

      <pattern
        id="starPattern"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
      >
        <rect x="0" y="0" width="40" height="40" fill="#000" />
        <circle cx="10" cy="10" r="1.2" fill="#fff" opacity="0.8" class="${
          level <= 5 ? 'twinkle-star' :
          level <= 10 ? 'pulse-star' :
          level <= 15 ? 'spin-star' :
          'stream-star'
        }"/>
        <circle cx="25" cy="20" r="1.2" fill="#fff" opacity="0.6" class="${
          level <= 5 ? 'twinkle-star' :
          level <= 10 ? 'pulse-star' :
          level <= 15 ? 'spin-star' :
          'stream-star'
        }"/>
        <circle cx="35" cy="30" r="1.3" fill="#fff" opacity="0.5" class="${
          level <= 5 ? 'twinkle-star' :
          level <= 10 ? 'pulse-star' :
          level <= 15 ? 'spin-star' :
          'stream-star'
        }"/>
        <circle cx="5" cy="35" r="1.0" fill="#fff" opacity="0.7" class="${
          level <= 5 ? 'twinkle-star' :
          level <= 10 ? 'pulse-star' :
          level <= 15 ? 'spin-star' :
          'stream-star'
        }"/>
      </pattern>

      <pattern id="starPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <text x="25" y="25" font-size="20" fill="#FFFF00" text-anchor="middle" class="streaming-star">★</text>
        <text x="75" y="50" font-size="20" fill="#FFFF00" text-anchor="middle" class="streaming-star">★</text>
        <text x="50" y="75" font-size="20" fill="#FFFF00" text-anchor="middle" class="streaming-star">★</text>
      </pattern>
    </defs>

    <style>
      .pixel-font {
        font-family: monospace;
        font-weight: bold;
        letter-spacing: 1px;
      }
      .card-title {
        fill: #FFFCE8;
        font-size: 24px;
        text-anchor: middle;
      }
      .stat-text {
        fill: #FFC0CB;
        font-size: 18px;
      }
      .desc-text {
        fill: #00FF00;
        font-size: 16px;
        font-family: sans-serif;
        text-anchor: middle;
      }
      .rareness-text {
        fill: #00FF00;
        font-size: 20px;
        font-weight: bold;
        text-anchor: middle;
      }
      .rarity-line {
        fill: #FF00EA;
        font-size: 24px;
        font-weight: bold;
        text-anchor: middle;
      }
      .footer-text {
        fill: #FFD700;
        font-size: 12px;
        text-anchor: middle;
      }
      text { user-select: none; }
      
      @keyframes strokeFlicker {
        0%   { stroke-dashoffset: 0; }
        50%  { stroke-dashoffset: ${10 + level}; }
        100% { stroke-dashoffset: 0; }
      }
      .flicker-stroke {
        stroke-dasharray: ${10 + level},${10 + level};
        animation: strokeFlicker ${0.1 + (level * 0.01)}s infinite steps(6);
      }

      @keyframes colorPulse1 {
        0%   { fill: #FF3AF7; }
        25%  { fill: #FF8500; }
        50%  { fill: #ADFF2F; }
        75%  { fill: #00C3FF; }
        100% { fill: #FF3AF7; }
      }
      .pulse-bg { animation: colorPulse1 4s infinite; }

      @keyframes colorPulse2 {
        0%   { fill: #FF8500; }
        25%  { fill: #FF00EA; }
        50%  { fill: #FFFF00; }
        75%  { fill: #00FFC0; }
        100% { fill: #FF8500; }
      }
      .pulse-bg2 { animation: colorPulse2 4s infinite; }

      @keyframes eyePulse {
        0%   { rx: ${12 + level}; ry: ${25 + level}; }
        50%  { rx: ${14 + level}; ry: ${28 + level}; }
        100% { rx: ${12 + level}; ry: ${25 + level}; }
      }
      .pulsing-eyes {
        animation: eyePulse ${1 + (level * 0.1)}s infinite;
      }

      @keyframes eyeRotate {
        0%   { transform: rotate(0deg); }
        50%  { transform: rotate(${layout.eyeSize.rotation ? layout.eyeSize.rotation * 5 : 0}deg); }
        100% { transform: rotate(0deg); }
      }

      @keyframes symbolFloat {
        0%   { transform: translateY(0); }
        50%  { transform: translateY(-5px); }
        100% { transform: translateY(0); }
      }

      @keyframes symbolRotate {
        0%   { transform: rotate(-${level > 1 ? 20 : 0}deg); }
        50%  { transform: rotate(${level > 1 ? 20 : 0}deg); }
        100% { transform: rotate(-${level > 1 ? 20 : 0}deg); }
      }

      .floating-symbol {
        animation: symbolFloat ${2 + (level * 0.1)}s infinite ease-in-out;
      }

      .rotating-symbol {
        transform-origin: center;
        animation: ${level > 1 ? `symbolRotate ${2 - (level * 0.05)}s infinite ease-in-out` : 'none'};
      }

      .rotating-eyes {
        animation: eyeRotate ${4 - (level * 0.1)}s infinite ease-in-out;
      }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .spinning {
        transform-box: fill-box;
        transform-origin: center;
        animation: spin ${4 - (level * 0.1)}s linear infinite;
      }

      .spinning-slow {
        transform-box: fill-box;
        transform-origin: center;
        animation: spin ${8 - (level * 0.2)}s linear infinite;
      }

      @keyframes streamDown {
        from { transform: translateY(-50px); }
        to { transform: translateY(50px); }
      }
      .streaming-star {
        animation: streamDown 8s linear infinite;
        opacity: 0.8;
      }

      @keyframes twinkle {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 0.2; }
      }
      .twinkle-star {
        animation: twinkle 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { r: 1.2; }
        50% { r: 1.8; }
      }
      .pulse-star {
        animation: pulse 3s ease-in-out infinite;
      }

      @keyframes spin {
        0% { 
          cx: 10;
          cy: 10;
        }
        25% {
          cx: 30;
          cy: 10;
        }
        50% {
          cx: 30;
          cy: 30;
        }
        75% {
          cx: 10;
          cy: 30;
        }
        100% {
          cx: 10;
          cy: 10;
        }
      }
      .spin-star {
        animation: spin 4s linear infinite;
      }

      @keyframes stream {
        from { transform: translateY(-40px); }
        to { transform: translateY(40px); }
      }
      .stream-star {
        animation: stream 3s linear infinite;
      }

      @keyframes orbit {
        from {
          offset-distance: 0%;
        }
        to {
          offset-distance: 100%;
        }
      }

      .orbit-path {
        offset-path: circle(20px);
      }

      .orbit-element {
        offset-path: circle(20px);
        animation: orbit ${4 - (level * 0.1)}s linear infinite;
      }

      @keyframes simpleRotate {
        0% { transform: rotate(0deg) translateX(0) rotate(0deg); }
        100% { transform: rotate(360deg) translateX(0) rotate(-360deg); }
      }

      .orbit-element {
        transform-origin: 50% 50%;
        animation: simpleRotate ${4 - (level * 0.1)}s linear infinite;
      }

      ${level > 10 ? `
        .glow-box:hover {
          filter: url(#intenseNeonGlow) brightness(1.2);
          transition: filter 0.3s;
        }
        .card-title:hover {
          text-shadow: 0 0 10px #FFF;
        }
      ` : ''}
    </style>
  `;
};

const templates = {
  baseSVG(level) {
    const layout = getLayout(level);
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg 
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    width="600"
    height="800"
    viewBox="0 0 600 800"
    version="1.1"
>
  ${getEvolutionEffects(level)}

  <g class="pixel-font">
    <rect
      x="0" y="0"
      width="600" height="800"
      fill="url(#starPattern)"
      filter="url(#rainbowBG)"
    />

    <rect
      x="10" y="10"
      width="580" height="780"
      rx="${20 + Math.floor(level/3)}" ry="${20 + Math.floor(level/3)}"
      fill="none"
      stroke="${getColorScheme(level).border.primary}"
      stroke-width="${4 + (level * 0.2)}"
      class="flicker-stroke"
    />

    <rect
      x="30" y="20"
      width="540" height="60"
      rx="10" ry="10"
      class="pulse-bg"
      stroke="#5A3419"
      stroke-width="4"
    />
    <text class="card-title" x="300" y="58">HIGHER^${6 + level} CULT MEMBER</text>
    <text x="100" y="65" font-size="40" fill="#FFC0CB">♥</text>
    <text x="500" y="65" font-size="40" fill="#FFC0CB" text-anchor="end">♥</text>
    
    <rect
      x="30" y="90"
      width="540" height="40"
      rx="5" ry="5"
      class="pulse-bg2"
      stroke="#5A3419"
      stroke-width="3"
    />
    <text class="stat-text" x="70"  y="116">HP: ${69 * level}</text>
    <text class="stat-text" x="190" y="116">ATK: ${420 * level}</text>
    <text class="stat-text" x="320" y="116">SPD: ${1337 * level}</text>
    <text class="stat-text" x="460" y="116">ELE: ${
      level > 15 ? 'DMT' : 
      level > 10 ? 'KET' : 
      level > 5 ? 'MDMA' : 'LSD'
    }</text>

    <rect
      x="80" y="160"
      width="440" height="280"
      rx="10" ry="10"
      fill="url(#starPattern)"
      stroke="#FFFF00"
      stroke-width="4"
      class="flicker-stroke"
    />
    
    <path
      d="M250,210 c-20,-20 -45,-20 -40,0"
      fill="none" stroke="#FF0000" stroke-width="4"
    />
    <path
      d="M320,210 c20,-20 45,-20 40,0"
      fill="none" stroke="#FF0000" stroke-width="4"
    />

    <g transform="translate(260,250)">
      <g class="spinning-slow">
        <ellipse 
          cx="0" cy="0" 
          rx="${layout.eyeSize.rx}" 
          ry="${layout.eyeSize.ry}" 
          fill="url(#eyeGrad)"
        />
        <circle cx="0" cy="0" r="4" fill="#000"/>
      </g>
    </g>

    <g transform="translate(320,250)">
      <g class="spinning-slow">
        <ellipse 
          cx="0" cy="0" 
          rx="${layout.eyeSize.rx}" 
          ry="${layout.eyeSize.ry}" 
          fill="url(#eyeGrad)"
        />
        <circle cx="0" cy="0" r="4" fill="#000"/>
      </g>
    </g>

    <path
      d="M137.474 19.2L184.862 7.0005L171.82 53.8766L162.398 44.3588L158.903 40.828L155.35 44.3008L89.4148 108.749L89.4106 108.753C87.094 111.023 83.3658 111.078 80.9764 108.867L80.9751 108.866L54.1559 84.0601L50.7263 80.8879L47.3289 84.0945L15.2929 114.331C15.2925 114.332 15.292 114.332 15.2916 114.333C14.1082 115.447 12.607 116 11.0913 116C9.45082 116 7.85937 115.368 6.66925 114.121L6.66222 114.114C4.36451 111.715 4.4588 107.926 6.8841 105.636C6.88422 105.636 6.88434 105.636 6.88446 105.635L46.4774 68.2616L46.481 68.2581C48.8083 66.0569 52.4792 66.0371 54.8318 68.2171L54.8344 68.2194L81.5162 92.908L85.0071 96.1381L88.4076 92.8131L146.773 35.7443L150.37 32.2271L146.831 28.6517L137.474 19.2Z"
      fill="#00FF00" stroke="#00FF00" stroke-width="10"
      transform="translate(280,300) scale(0.15)"
      opacity="0.9"
    />

    <text x="300" y="400" fill="#00FFFF" font-size="32" text-anchor="middle" class="floating-symbol">↑↑↑</text>

    <text x="160" y="300" fill="#00FF00" font-size="24" text-anchor="middle" class="rotating-symbol">8===D</text>
    <text x="440" y="300" fill="#00FF00" font-size="24" text-anchor="middle" class="rotating-symbol">~~~~~</text>

    <rect
      x="60" y="460"
      width="480" height="150"
      rx="10" ry="10"
      fill="#000"
      class="glow-box"
    />
    <text class="desc-text">
      <tspan x="300" y="490">Summoned from the cryptic depths</tspan>
      <tspan x="300" y="515">of degenerate lore, this artifact</tspan>
      <tspan x="300" y="540">binds the faithful to Higherrrrrrr.</tspan>
      <tspan x="300" y="565">Wen reveal? Wen pump?</tspan>
      <tspan x="300" y="590">Only the chosen may ascend.</tspan>
    </text>

    <rect
      x="150" y="650"
      width="300" height="70"
      rx="8" ry="8"
      fill="#00FF00"
      filter="url(#neonBoxGlow)"
    />
    <rect
      x="150" y="650"
      width="300" height="70"
      rx="8" ry="8"
      fill="#000"
    />
    <text class="rareness-text" x="300" y="680">Rareness Score: ${(93.69 + (level * 2.5)).toFixed(2)}</text>
    <text class="rarity-line" x="300" y="705">${level > 1 ? `Level ${level} ` : ''}Rare AF</text>

    <text class="footer-text" x="300" y="770">© 2025 Cult of Higherrrrrrr | All Rites Reserved</text>
  </g>
</svg>`;
  },

  generateComplete(level = 1) {
    return this.baseSVG(level);
  }
};

module.exports = templates;