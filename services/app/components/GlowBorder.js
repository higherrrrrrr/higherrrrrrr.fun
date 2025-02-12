import React from 'react';

export function GlowBorder({ children, className = '', disabled = false }) {
  return (
    <div className={`
      relative rounded-lg
      transition-all duration-500 ease-out
      border border-green-500/60
      hover:border-green-400
      hover:shadow-[0_0_10px_rgba(74,222,128,0.7),0_0_20px_rgba(74,222,128,0.4),0_0_30px_rgba(74,222,128,0.4),0_0_40px_rgba(74,222,128,0.2)]
      ${disabled ? 'opacity-70 cursor-not-allowed hover:transform-none hover:border-green-500/50 hover:shadow-none' : ''}
      ${className}
    `}>
      {/* Gradient border overlay on hover */}
      {!disabled && (
        <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-500
                      bg-gradient-to-r from-green-500/30 via-green-500/25 to-green-500/20 pointer-events-none" />
      )}

      {/* Content container */}
      <div className="relative bg-black/90 rounded-lg">
        {children}
      </div>
    </div>
  );
} 