// pages/how-it-works.js
'use client';

import Head from 'next/head';

export default function HowItWorks() {
  return (
    <div className="prose prose-invert prose-green max-w-none bg-black py-8">
      <Head>
        <title>How It Works</title>
      </Head>
      <div className="max-w-[800px] mx-auto px-4">
        {/* Manifesto Section */}
        <section id="manifesto" className="mb-12">
        <div className="max-w-[800px] mx-auto">
          <h1
            className="text-4xl font-mono mb-8 relative inline-block text-green-500 text-shadow-glitch
                      before:content-[attr(data-text)] before:absolute before:left-0 before:top-0
                      before:overflow-hidden before:clip-[rect(0,900px,0,0)] before:opacity-90
                      before:text-cyan-400 before:animate-glitch-top
                      after:content-[attr(data-text)] after:absolute after:left-0 after:top-0
                      before:overflow-hidden before:clip-[rect(0,900px,0,0)] after:opacity-90
                      after:text-fuchsia-400 after:animate-glitch-bottom"
            data-text="Manifesto"
          >
            Manifesto
          </h1>
        </div>
          <div className="terminal-text text-green-500">
            <p className="mb-4">
              The greatest movements in human history weren't built on rational economic incentives. They were built on belief. When you look critically at the largest projects in crypto, it becomes clear that we're not building protocols – we're creating new ideologies.
            </p>
            <p className="mb-4">
              Bitcoin isn't just technology. It's a belief system with its own prophet, rituals, and sacred artifacts. Satoshi isn't merely a founder – he is the messiah who delivered the genesis block and ascended into legend, leaving behind a testament of code that would forever change humanity.
            </p>
            <p className="mb-4">
              This isn't accidental. This is the territory of transformative change.
            </p>
            <p className="mb-4">
              Launching a movement is fundamentally different from launching a product. You don't begin with market fit – you begin with a manifesto. You don't solve pain points – you create true believers. The traditional structures of ownership and control become irrelevant. Like Satoshi, the founder must be willing to fade into mythology, holding little beyond the satisfaction of setting something greater than themselves into motion.
            </p>
            <p className="mb-4">
              What we're creating transcends the material. It's a new framework for belief in the digital age. A system that explicitly acknowledges what cryptocurrency has known implicitly since its inception – that faith moves mountains, markets, and minds more than logic ever could.
            </p>
            <p>
              These are <strong>cult</strong> coins. We are going much, much higherrrrrrr.
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works">
          <h1 className="text-4xl font-mono mb-8 text-green-500">
            How it Works?
          </h1>
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-mono text-green-500">Trade Any Meme</h2>
              <p className="text-green-500">
                Higherrrrrrr is your gateway to the wildest corners of meme trading. Whether you're into classic memes, evolving tokens, or the next big thing, our platform supports all types of meme coins. From simple dog coins to complex evolutionary tokens, if it's a meme, you can trade it here.
              </p>
              <p className="text-green-500">
                For creators looking to launch something special, we offer advanced features like evolving metadata, conviction NFTs, and automated social presence - but these are optional. The core platform is open to all meme traders and creators.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-mono text-green-500">Advanced Features (Optional)</h2>
              <p className="text-green-500">
                For projects seeking something extra, we offer cutting-edge features like evolving tokens that change based on market milestones, conviction NFTs for dedicated holders, and AI-powered social media integration. These tools are available but not required - use what fits your vision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-mono text-green-500">Community First</h2>
              <p className="text-green-500">
                At Higherrrrrrr, we believe that memes are fundamentally about community. Our platform is designed to amplify the social aspects of trading, with features like HiLites spotlighting interesting projects and integrated social tools to help communities grow organically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-mono text-green-500">Fair Launch & Trading</h2>
              <p className="text-green-500">
                Whether you're launching a new token or trading existing ones, our platform ensures fair and transparent mechanics. Creators can configure tokenomics that make sense for their project, while traders benefit from clear pricing and efficient execution.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-mono font-bold text-green-500 mb-4">FAQ</h2>
              <h3 className="text-xl font-mono text-green-500 mt-6">
                What kinds of tokens can I trade?
              </h3>
              <p className="text-green-500">
                Any meme token! While we offer special features for evolving tokens, our platform supports trading of all meme coins. If it exists on Solana and has meme energy, you can trade it here.
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                How much does it cost to launch a token?
              </h3>
              <p className="text-green-500">
                Launching a token is completely free – you only pay the network's gas fees. Advanced features like evolution mechanics are optional.
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                What are the trading fees?
              </h3>
              <p className="text-green-500">
                Standard trading fees apply - typically 1% per swap, which helps maintain platform liquidity and development.
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                Can I list my existing token?
              </h3>
              <p className="text-green-500">
                Yes! While we're known for our evolving tokens, any legitimate meme token can be listed and traded on our platform.
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                Is the code open source?
              </h3>
              <p className="text-green-500">
                Yes! Our protocol is fully open source and available for review on{' '}
                <a
                  href="https://github.com/higherrrrrrr/higherrrrrrr.fun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-green-400"
                >
                  GitHub
                </a>.
              </p>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
