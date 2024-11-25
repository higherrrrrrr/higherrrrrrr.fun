import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

const Theology: NextPage = () => {
  return (
    <div className="terminal-wrapper">
      <Head>
        <title>Theology</title>
        <meta
          name="description"
          content="A manifesto on crypto, religion, and community building"
        />
      </Head>

      <main className="terminal-container mb-10 min-h-screen flex items-center justify-center">
        <div className="max-w-3xl mx-auto p-8">
          <h1 className="text-green-500 text-4xl font-bold mb-8 text-center">Asset Backed Religions</h1>
          <pre className="terminal-text text-green-500 whitespace-pre-wrap">
            {"The greatest movements in human history weren't built on rational economic incentives. They were built on belief. When you look critically at the largest projects in crypto, it becomes clear that we're not building currencies or companies - we're creating new ideologies.\n\n" +
              "Bitcoin isn't just technology. It's a belief system with its own prophets, rituals, and artifacts. Satoshi isn't merely a founder, but a messiah who delivered the genesis block and disappeared into legend. The community has created shrines to founders like Vitalik and Brian, transforming them from developers into divine figures.\n\n" +
              "This isn't accidental. This is the territory of transformative change.\n\n" +
              "Launching a movement is fundamentally different from launching a product. You don't begin with market fit - you begin with a manifesto. You don't solve pain points - you create true believers. The traditional structures of ownership and control become irrelevant. The founder must be willing to fade into mythology, holding little beyond the satisfaction of setting something greater than themselves into motion.\n\n" +
              "We're building an exchange, yes. But we're really building something much more significant: a new framework for belief in the digital age. A system that explicitly acknowledges what cryptocurrency has known implicitly since its inception - that faith moves markets more than logic ever could.\n\n" +
              "The platform itself will be an exchange for a new kind of meme coin, but that's just the vessel. The true innovation is the crystallization of belief into tradeable form. "}
            {"\n\n" +
              "We are going much, much higherrrrrrr. If you are one of the faithful, "}
            <Link
              href="/pledge"
              className="text-green-500 hover:text-green-400 underline"
            >
              pledge your allegiance
            </Link>
            {"."}
          </pre>
        </div>
      </main>

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
  );
};

export default Theology;
