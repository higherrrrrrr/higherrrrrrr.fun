import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black">
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 max-w-3xl mx-auto px-4">
        <Link
          href="https://twitter.com/higherrrrrrrfun"
          target="_blank"
          className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
        >
          Twitter
        </Link>
        <Link
          href="https://discord.gg/RKrFDw8jRW"
          target="_blank"
          className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
        >
          Discord
        </Link>
        <Link
          href="/theology"
          className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
        >
          Theology
        </Link>
        <Link
          href="/protocol"
          className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
        >
          Protocol
        </Link>
        <Link
          href="https://roadmap.higherrrrrrr.fun"
          target="_blank"
          className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
        >
          Roadmap
        </Link>
        <Link
          href="https://warpcast.com/~/channel/higherrrrrrr"
          target="_blank"
          className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
        >
          Warpcast
        </Link>
      </div>
    </footer>
  );
}; 