export function SnakeBorder({ children, className = '', disabled = false }) {
  return (
    <div className={`
      snake-border
      ${disabled ? 'opacity-50 cursor-not-allowed hover:transform-none' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
} 