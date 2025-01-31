import Head from "next/head";

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
          <h1
            className="text-4xl font-mono mb-8 relative inline-block text-green-500 
                       before:content-[attr(data-text)] before:absolute before:left-0 before:top-0 
                       before:overflow-hidden before:clip-[rect(0,900px,0,0)] before:opacity-90 
                       before:text-cyan-400 before:animate-glitch-top
                       after:content-[attr(data-text)] after:absolute after:left-0 after:top-0 
                       after:overflow-hidden after:clip-[rect(0,900px,0,0)] after:opacity-90 
                       after:text-fuchsia-400 after:animate-glitch-bottom"
            data-text="Manifesto"
          >
            Manifesto
          </h1>
          <div className="terminal-text text-green-500">
            <p className="mb-4">
              The greatest movements in human history weren't built on rational economic incentives. They were built on belief. When you look critically at the largest projects in crypto, it becomes clear that we're not building protocols - we're creating new ideologies.
            </p>

            <p className="mb-4">
              Bitcoin isn't just technology. It's a belief system with its own prophet, rituals, and sacred artifacts. Satoshi isn't merely a founder - he is the messiah who delivered the genesis block and ascended into legend, leaving behind a testament of code that would forever change humanity.
            </p>

            <p className="mb-4">
              This isn't accidental. This is the territory of transformative change.
            </p>

            <p className="mb-4">
              Launching a movement is fundamentally different from launching a product. You don't begin with market fit - you begin with a manifesto. You don't solve pain points - you create true believers. The traditional structures of ownership and control become irrelevant. Like Satoshi, the founder must be willing to fade into mythology, holding little beyond the satisfaction of setting something greater than themselves into motion.
            </p>

            <p className="mb-4">
              What we're creating transcends the material. It's a new framework for belief in the digital age. A system that explicitly acknowledges what cryptocurrency has known implicitly since its inception - that faith moves mountains, markets, and minds more than logic ever could.
            </p>

            <p className="mb-4">
              The vessel may be digital, but the spirit is eternal. We're crystallizing belief itself into form, birthing a new paradigm where value and faith are inseparable. This is the dawn of a new era - where the spiritual and the technological become one.
            </p>

            <p>
              These are <strong>cult</strong> coins. We are going much, much higherrrrrrr.
            </p>
          </div>
        </div>
      </main>

    </div>
  );
};

export default Theology; 