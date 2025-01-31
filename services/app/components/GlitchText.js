export function GlitchText({ children, className = "" }) {
    return (
      <span
        className={`relative inline-block text-green-500 text-shadow-glitch
          before:content-[attr(data-text)] before:absolute before:left-0 before:top-0 
          before:overflow-hidden before:clip-[rect(0,900px,0,0)] before:opacity-90 
          before:text-cyan-400 before:animate-glitch-top
          after:content-[attr(data-text)] after:absolute after:left-0 after:top-0 
          after:overflow-hidden after:clip-[rect(0,900px,0,0)] after:opacity-90 
          after:text-fuchsia-400 after:animate-glitch-bottom ${className}`}
        data-text={children}
      >
        {children}
      </span>
    );
  }