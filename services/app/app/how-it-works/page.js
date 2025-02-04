// pages/how-it-works.js
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
                      after:overflow-hidden after:clip-[rect(0,900px,0,0)] after:opacity-90 
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
          <h1 
            className="text-4xl font-mono mb-8 relative inline-block text-green-500 text-shadow-glitch
                      before:content-[attr(data-text)] before:absolute before:left-0 before:top-0 
                      before:overflow-hidden before:clip-[rect(0,900px,0,0)] before:opacity-90 
                      before:text-cyan-400 before:animate-glitch-top
                      after:content-[attr(data-text)] after:absolute after:left-0 after:top-0 
                      after:overflow-hidden after:clip-[rect(0,900px,0,0)] after:opacity-90 
                      after:text-fuchsia-400 after:animate-glitch-bottom"
            data-text="How it Works?"
          >
            How it Works?
          </h1>
          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-mono text-green-500">Evolutionary Tokens</h2>
              <p className="text-green-500">
                Traditional tokens remain static from launch, missing the dynamic energy of the communities they represent. We're introducing something different – tokens that evolve and grow with their community.
              </p>
              <p className="text-green-500">
                Each price milestone unlocks a new evolution, transforming the token's fundamental properties on-chain. This creates natural momentum as communities work together toward the next evolution, with each new form becoming a shared achievement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-mono text-green-500">How Evolutions Work</h2>
              <p className="text-green-500">
                Every purchase moves the token closer to its next evolution. As the price reaches new milestones, the token automatically transforms – its name, symbol, and identity evolve through smart contracts.
              </p>
              <div className="overflow-x-auto my-6 bg-black/25 rounded-lg border border-green-500/20">
                <table className="w-full text-green-500 border-collapse">
                  <thead>
                    <tr className="border-b border-green-500/20">
                      <th className="text-left p-4 font-mono">Level</th>
                      <th className="text-left p-4 font-mono">Name</th>
                      <th className="text-right p-4 font-mono">Price</th>
                      <th className="text-right p-4 font-mono">Market Cap</th>
                      <th className="text-right p-4 font-mono">State</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-b border-green-500/10">
                      <td className="p-4">1</td>
                      <td className="p-4 whitespace-nowrap">¯\_(ツ)_/¯</td>
                      <td className="text-right p-4">Free</td>
                      <td className="text-right p-4">-</td>
                      <td className="text-right p-4 text-green-500">Achieved</td>
                    </tr>
                    <tr className="border-b border-green-500/10">
                      <td className="p-4">2</td>
                      <td className="p-4 whitespace-nowrap">¯\__(ツ)__/¯</td>
                      <td className="text-right p-4">$0.000037</td>
                      <td className="text-right p-4">$36.50K</td>
                      <td className="text-right p-4 text-green-500">Achieved</td>
                    </tr>
                    <tr className="border-b border-green-500/10">
                      <td className="p-4">3</td>
                      <td className="p-4 whitespace-nowrap">¯\____(ツ)____/¯</td>
                      <td className="text-right p-4">$0.000073</td>
                      <td className="text-right p-4">$73.00K</td>
                      <td className="text-right p-4 text-green-500">Achieved</td>
                    </tr>
                    <tr className="border-b border-green-500/10">
                      <td className="p-4">4</td>
                      <td className="p-4 whitespace-nowrap">¯\______(ツ)______/¯</td>
                      <td className="text-right p-4">$0.000146</td>
                      <td className="text-right p-4">$146.00K</td>
                      <td className="text-right p-4 text-green-500">Current</td>
                    </tr>
                    <tr>
                      <td className="p-4">5</td>
                      <td className="p-4 whitespace-nowrap">¯\_________(ツ)________/¯</td>
                      <td className="text-right p-4">$0.000292</td>
                      <td className="text-right p-4">$292.00K</td>
                      <td className="text-right p-4 text-gray-500">Locked</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-green-500/60 mt-4">
                Each evolution extends the arms of our friend (ツ), representing the growing reach of your community.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-mono text-green-500">Conviction NFTs</h2>
              <p className="text-green-500">
                Conviction NFTs are your proof of being an early believer. When you purchase more than 420,690 tokens, you automatically receive a unique NFT that captures that moment in the token's evolution. After this initial mint you must add your wallet to the registry (only once) and as subsequent levels are passed you can claim those NFTs – just make sure to do it before the next level is hit!
              </p>
              <p className="text-green-500">
                These NFTs become increasingly valuable because:
              </p>
              <ul className="text-green-500">
                <li>Earlier purchases are rarer and more historically significant</li>
                <li>Each evolution stage has a limited number of possible NFTs</li>
                <li>They prove you were there before major price milestones</li>
                <li>The dynamic artwork evolves with the token's journey</li>
                <li>They're permanent on-chain proof of your early conviction</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-mono font-bold text-green-500 mb-4">FAQ</h2>
              <h3 className="text-xl font-mono text-green-500 mt-6">
                How much does it cost to launch a token?
              </h3>
              <p className="text-green-500">
                Launching a token is completely free – you only pay the network's gas fees. We also have creator splits for LP fees and liquidity floor support.
                Please refer to our{' '}
                <a
                  href="https://github.com/higherrrrrrr/higherrrrrrr.fun/blob/main/docs/CREATOR-GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-green-400"
                >
                  Creator Guide
                </a>.
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                How does the initial token launch work?
              </h3>
              <p className="text-green-500">
                We allow teams to pre-mint up to 15% of the total supply with the option to vest. The remainder of the supply is deposited and locked in a single-sided LP on Orca.
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                When do I get my Conviction NFT?
              </h3>
              <p className="text-green-500">
                NFTs are automatically minted when you purchase more than 420,690 tokens. After this initial mint you must add your wallet to the registry (only once) and as subsequent levels are passed you can claim those NFTs – just make sure to do it before the next level is hit!
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                Who controls the evolution process?
              </h3>
              <p className="text-green-500">
                Everything happens automatically through smart contracts. There's no team intervention – the community's trading activity directly drives evolution.
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                What happens after the final evolution?
              </h3>
              <p className="text-green-500">
                The token maintains its final form but continues trading freely on the market. The achievement of reaching the final evolution is permanently recorded in its history.
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                What are the fees?
              </h3>
              <p className="text-green-500">
                Higherrrrrrr is free to launch. Every trade has a 1% fee that is split 50/50 between the creator and the Higherrrrrrr platform.
              </p>

              <h3 className="text-xl font-mono text-green-500 mt-6">
                Can I see the code?
              </h3>
              <p className="text-green-500">
                Yes! Our protocol is fully open source and available for review on{' '}
                <a
                  href="https://github.com/Thrive-Point-Group/higherrrrrrr-protocol"
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
