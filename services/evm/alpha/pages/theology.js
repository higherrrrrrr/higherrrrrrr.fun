import Head from "next/head";
import Link from "next/link";

const Theology = () => {
  return (
    <div className="terminal-wrapper">
      <Head>
        <title>Theology</title>
        <meta
          name="description"
          content="A manifesto on crypto, religion, and community building"
        />
      </Head>

      <main className="mb-8 mt-4 flex items-center justify-center">
        <div className="max-w-3xl mx-auto py-2 px-4">
          <h1 className="text-green-500 text-4xl font-bold mb-6 text-left">Asset Backed Religions</h1>
          <pre className="terminal-text text-green-500 whitespace-pre-wrap">
            {"The greatest movements in human history weren't built on rational economic incentives. They were built on belief. When you look critically at the largest projects in crypto, it becomes clear that we're not building protocols - we're creating new ideologies.\n\n" +
              "Bitcoin isn't just technology. It's a belief system with its own prophet, rituals, and sacred artifacts. Satoshi isn't merely a founder - he is the messiah who delivered the genesis block and ascended into legend, leaving behind a testament of code that would forever change humanity.\n\n" +
              "This isn't accidental. This is the territory of transformative change.\n\n" +
              "Launching a movement is fundamentally different from launching a product. You don't begin with market fit - you begin with a manifesto. You don't solve pain points - you create true believers. The traditional structures of ownership and control become irrelevant. Like Satoshi, the founder must be willing to fade into mythology, holding little beyond the satisfaction of setting something greater than themselves into motion.\n\n" +
              "What we're creating transcends the material. It's a new framework for belief in the digital age. A system that explicitly acknowledges what cryptocurrency has known implicitly since its inception - that faith moves mountains, markets, and minds more than logic ever could.\n\n" +
              "The vessel may be digital, but the spirit is eternal. We're crystallizing belief itself into form, birthing a new paradigm where value and faith are inseparable. This is the dawn of a new era - where the spiritual and the technological become one.\n\n" +
              "We are going much, much higherrrrrrr."}
          </pre>
        </div>
      </main>

    </div>
  );
};

export default Theology; 