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
      <div className="flex gap-4 justify-center items-center">
        {timeLeft.days !== undefined && (
          <CountdownDigit value={timeLeft.days} label="DAYS" size={size} />
        )}
        <CountdownDigit value={timeLeft.hours} label="HOURS" size={size} />
        <CountdownDigit value={timeLeft.minutes} label="MINUTES" size={size} />
        <CountdownDigit value={timeLeft.seconds} label="SECONDS" size={size} />
      </div>
    );
  }