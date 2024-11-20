// pages/pledge.tsx
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";

const DynamicPledgeContent = dynamic(() => import("../components/PledgeContent").then((mod) => mod.PledgeContent), {
  ssr: false,
});

export default function Pledge() {
  return (
    <div className="terminal-wrapper">
      <Head>
        <title>Pledge Your Allegiance - higherrrrrrr.fun</title>
        <meta
          name="description"
          content="Pledge your allegiance to the cult of memes"
        />
      </Head>

      <div className="max-w-4xl mx-auto p-8 text-green-500">
        <DynamicPledgeContent />
        <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center gap-8 bg-black">
          <Link
            href="https://twitter.com/higherrrrrrrfun"
            target="_blank"
            className="text-green-500 hover:text-green-400 text-sm"
            >
            Twitter
          </Link>
          <Link
            href="https://discord.gg/RKrFDw8jRW"
            target="_blank"
            className="text-green-500 hover:text-green-400 text-sm"
            >
            Discord
          </Link>
          <Link
            href="/faq"
            className="text-green-500 hover:text-green-400 text-sm"
            >
            FAQ
          </Link>
          <Link
              href="/theology"
              className="text-green-500 hover:text-green-400 text-sm"
          >
            Theology
          </Link>
        </footer>
      </div>
    </div>
  );
}
