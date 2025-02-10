export default function HighlightsSkeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-black border border-green-500/30 rounded-lg p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-6 w-20 bg-green-500/20 rounded mb-2"></div>
              <div className="h-4 w-32 bg-green-500/10 rounded"></div>
            </div>
            <div className="h-6 w-16 bg-green-500/20 rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-green-500/10 rounded"></div>
              <div className="h-4 w-24 bg-green-500/20 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-green-500/10 rounded"></div>
              <div className="h-4 w-28 bg-green-500/20 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-green-500/10 rounded"></div>
              <div className="h-4 w-32 bg-green-500/20 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
} 