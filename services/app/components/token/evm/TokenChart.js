export function TokenChart({ poolAddress }) {
  return (
    <div className="relative border border-green-500/30 rounded-lg overflow-hidden">
      <iframe
        src={`https://www.geckoterminal.com/base/pools/${poolAddress}?embed=1&info=0&swaps=0&chart=1`}
        width="100%"
        height="400px"
        frameBorder="0"
        className="relative z-0 bg-black"
        title="Price Chart"
        style={{
          filter: 'brightness(90%) grayscale(100%) sepia(100%) hue-rotate(70deg) saturate(150%) contrast(150%)',
          backgroundColor: 'black',
        }}
      />
    </div>
  );
} 