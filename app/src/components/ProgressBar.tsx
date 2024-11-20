interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div>
      <div className="h-6 w-full bg-black border border-green-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,#22c55e_50%,transparent_100%)] animate-[scan_2s_linear_infinite] opacity-20" />
        <div className="absolute inset-0 flex items-center justify-start px-2">
          <div className="font-mono text-xs text-green-500">
            PROGRESS: {progress}%
          </div>
        </div>
        <div
          className="h-full bg-green-600/20 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-green-500/20">
            <div className="h-full w-1 bg-green-400 animate-[progress-pulse_1s_ease-in-out_infinite] absolute right-0" />
          </div>
          <div className="absolute top-0 right-0 h-full w-[1px] bg-green-400 shadow-[0_0_8px_#22c55e]" />
        </div>
      </div>
    </div>
  );
}
