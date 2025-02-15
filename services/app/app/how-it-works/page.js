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

        {/* TL;DR Section */}
        <section id="tldr" className="mb-16">
          <h1
            className="text-4xl font-mono mb-8 relative inline-block text-green-500 text-shadow-glitch
                      before:content-[attr(data-text)] before:absolute before:left-0 before:top-0
                      before:overflow-hidden before:clip-[rect(0,900px,0,0)] before:opacity-90
                      before:text-cyan-400 before:animate-glitch-top
                      after:content-[attr(data-text)] after:absolute after:left-0 after:top-0
                      before:overflow-hidden before:clip-[rect(0,900px,0,0)] after:opacity-90
                      after:text-fuchsia-400 after:animate-glitch-bottom"
            data-text="TL;DR"
          >
            TL;DR
          </h1>
          <div className="border border-green-500/20 rounded-lg p-6 bg-black/20">
            <p className="text-green-500 text-lg">
              Higherrrrrrr is the finest place on the internet to trade shitcoins. We support all meme tokens on Solana, from simple dog coins to complex evolving tokens. Launch for free, trade with transparency, and build your community. Optional advanced features available for projects that want to go higherrrrrrr.
            </p>
          </div>
        </section>

        {/* Detailed How It Works Section */}
        <section id="how-it-works">
          <h1
            className="text-4xl font-mono mb-8 relative inline-block text-green-500 text-shadow-glitch
                      before:content-[attr(data-text)] before:absolute before:left-0 before:top-0
                      before:overflow-hidden before:clip-[rect(0,900px,0,0)] before:opacity-90
                      before:text-cyan-400 before:animate-glitch-top
                      after:content-[attr(data-text)] after:absolute after:left-0 after:top-0
                      before:overflow-hidden before:clip-[rect(0,900px,0,0)] after:opacity-90
                      after:text-fuchsia-400 after:animate-glitch-bottom"
            data-text="How it Works - The Details"
          >
            How it Works - The Details
          </h1>
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-mono text-green-500">Trading Platform</h2>
              <p className="text-green-500">
                At its core, Higherrrrrrr is a trading platform for all types of meme tokens on Solana. Our interface is designed for both casual traders and serious degens, with features like:
              </p>
              <ul className="list-disc pl-6 text-green-500">
                <li>Real-time price charts and market data</li>
                <li>Efficient order execution through Jupiter</li>
                <li>Transparent fee structure (1% swap fee on Higherrrrrrr tokens)</li>
                <li>Token information and social links</li>
                <li>Trading history and portfolio tracking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-mono text-green-500">Token Launch Platform</h2>
              <p className="text-green-500">
                Launching a token on Higherrrrrrr is straightforward and flexible. Creators can:
              </p>
              <ul className="list-disc pl-6 text-green-500">
                <li>Deploy tokens with custom tokenomics</li>
                <li>Configure initial supply and distribution</li>
                <li>Set up single-sided liquidity pools</li>
                <li>Choose advanced features (optional)</li>
              </ul>
              <p className="text-green-500 mt-4">
                The platform supports both standard tokens and those utilizing our advanced features like evolution mechanics.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-mono text-green-500">Advanced Features (Optional)</h2>
              <h3 className="text-xl font-mono text-green-500 mt-4">Evolution Mechanics</h3>
              <p className="text-green-500">
                Tokens can be configured to evolve based on market cap milestones. Each evolution can update:
              </p>
              <ul className="list-disc pl-6 text-green-500">
                <li>Token name and symbol</li>
                <li>Token artwork and metadata</li>
                <li>Community perks and features</li>
              </ul>

              <h3 className="text-xl font-mono text-green-500 mt-4">Conviction NFTs</h3>
              <p className="text-green-500">
                Projects can enable Conviction NFTs, which are awarded to holders with significant token positions (0.042069% of supply). These NFTs:
              </p>
              <ul className="list-disc pl-6 text-green-500">
                <li>Evolve with the token</li>
                <li>Prove early supporter status</li>
                <li>Can unlock special perks</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-mono text-green-500">Tokenomics & Fees</h2>
              <p className="text-green-500">
                Our platform uses a simple and transparent fee structure:
              </p>
              <ul className="list-disc pl-6 text-green-500">
                <li>1% swap fee on all trades</li>
                <li>0.5% burned (deflationary)</li>
                <li>0.5% to liquidity and development</li>
                <li>Optional creator fee configurations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-mono text-green-500">Community Features</h2>
              <p className="text-green-500">
                Community building tools include:
              </p>
              <ul className="list-disc pl-6 text-green-500">
                <li>HiLites for featured projects</li>
                <li>Custom project pages and lore</li>
                <li>Integrated social features</li>
                <li>Community analytics and insights</li>
              </ul>
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
