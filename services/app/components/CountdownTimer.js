export function CountdownDigit({ value, label, size = "default" }) {
    const sizeClasses = {
      default: "text-2xl md:text-4xl p-3 min-w-[80px]",
      large: "text-3xl md:text-7xl p-2 md:p-4 min-w-[80px] md:min-w-[120px]"
    };
  
    return (
      <div className="flex flex-col items-center">
        <div className={`timer-snake-border font-bold mb-2 rounded-lg bg-black/50 ${sizeClasses[size]}`}>
          {value.toString().padStart(2, '0')}
        </div>
        <div className={`text-xs ${size === 'large' ? 'md:text-base' : 'md:text-sm'} text-green-500/60`}>
          {label}
        </div>
      </div>
    );
  }
  
  export function CountdownTimer({ timeLeft, size = "default" }) {
    return (
      <div className="relative">
        {/* Info icon with tooltip */}
        <div className="absolute -top-2 -right-2 group">
          <div className="cursor-help text-green-500/60 hover:text-green-500/80 transition-colors">
            ⓘ
          </div>
          <div className="invisible group-hover:visible absolute bottom-full right-0 mb-2 w-64 p-3 bg-black border border-green-500/30 rounded-lg shadow-lg text-xs text-green-500/80 z-10">
            Launch times may be adjusted by project creators based on market conditions. Changes by the Higherrrrrrr team will be clearly communicated.
            <div className="absolute -bottom-1 right-3 w-2 h-2 bg-black border-r border-b border-green-500/30 transform rotate-45"></div>
          </div>
        </div>
  
        {/* Existing countdown display */}
        <div className="flex gap-4 justify-center items-center">
          {timeLeft.days !== undefined && (
            <CountdownDigit value={timeLeft.days} label="DAYS" size={size} />
          )}
          <CountdownDigit value={timeLeft.hours} label="HOURS" size={size} />
          <CountdownDigit value={timeLeft.minutes} label="MINUTES" size={size} />
          <CountdownDigit value={timeLeft.seconds} label="SECONDS" size={size} />
        </div>
      </div>
    );
  }