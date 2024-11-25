import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

const Protocol: NextPage = () => {
  return (
    <div className="terminal-wrapper">
      <Head>
        <title>Protocol</title>
        <meta
          name="description"
          content="Technical details of the Higherrrrrrr protocol and token"
        />
      </Head>

      <main className="terminal-container mb-8 min-h-screen flex items-center justify-center">
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-green-500 text-4xl font-bold mb-6 text-left">Higherrrrrrr Protocol and Token</h1>
          <div className="terminal-text text-green-500 space-y-4">
            <p className="mb-4">
              The internet changed everything by making information infinite. But it was memes that made meaning infinite - creating a new universal language that spreads virally across every human boundary. Until now, we've been forced to express this new language through static tokens that can't capture its living, evolving nature.
            </p>
            
            <p className="mb-6">
              Today, we're introducing something different. Something that evolves. Something that grows with its community. Something that goes higherrrrrrr.
            </p>

            <h2 className="text-2xl font-bold mt-6 mb-3">Why Evolutionary Tokens?</h2>
            <p className="mb-4">
              Traditional tokens remain unchanged from the moment they launch, missing the dynamic energy of the communities they represent. They exist in a single state while meme culture moves at the speed of light, constantly transforming and reinventing itself.
            </p>
            
            <p className="mb-4">
              Evolutionary tokens change this paradigm entirely. They grow and transform with their community. Each price milestone unlocks a new evolution, changing the token's fundamental metadata - its name, symbol, and identity. The token evolves autonomously as it achieves new heights:
            </p>

            <pre className="bg-black/30 p-4 rounded-lg font-mono text-sm mb-6 flex flex-col">
              <span>$0.0001: "highr"</span>
              <span>$0.001:  "highrrr"</span>
              <span>$0.01:   "highrrrrrr"</span>
              <span>$0.1:    "highrrrrrrrrr"</span>
              <span>$1:      "highrrrrrrrrrrrr"</span>
            </pre>

            <p className="mb-6">
              This creates natural momentum around each evolution. Holders collectively work toward the next milestone, with each new form becoming its own shared achievement. The community's success is reflected directly in the token's identity.
            </p>

            <h2 className="text-2xl font-bold mt-6 mb-3">The Higherrrrrrr Protocol</h2>
            <p className="mb-4">
              We're open-sourcing a new token standard that makes evolution a fundamental primitive. The Higherrrrrrr Protocol serves as a launchpad for evolutionary tokens, allowing anyone to create tokens that grow and transform with their communities.
            </p>
            
            <p className="mb-6">
              The protocol combines bonding curves with Uniswap V3 price oracles to create tokens that autonomously evolve on-chain based on their market performance. Each token operates in two phases: an initial bonding curve distribution followed by market-driven price discovery through Uniswap V3. This creates a smooth transition from predictable early evolution to fully market-based growth.
            </p>

            <h2 className="text-2xl font-bold mt-6 mb-3">Technical Architecture</h2>
            <p className="mb-4">
              The core innovation of Higherrrrrrr Protocol is that token evolution happens entirely on-chain, with no external oracles or manual intervention required. The protocol uses bonding curves during initial distribution and Uniswap V3 price feeds after market graduation to autonomously track and update token evolution state.
            </p>
            
            <p className="mb-4">
              Every aspect of evolution - from price thresholds to name changes to Conviction NFT minting - is handled by immutable smart contracts. There's no team intervention, no off-chain voting, and no centralized control. The token evolves purely based on market performance.
            </p>
            
            <p className="mb-4">
              To ensure the security of these evolutionary mechanics, we're committing 2% of the total token supply to a bug bounty program focused on critical money-moving vulnerabilities in the protocol's smart contracts.
            </p>
            
            <p className="mb-4">
              For full technical details, including smart contract architecture and security features, visit our{" "}
              <Link
                href="https://github.com/Thrive-Point-Group/higherrrrrrr-protocol"
                target="_blank"
                className="text-green-500 hover:text-green-400 underline"
              >
                GitHub
              </Link>
              .
            </p>

            <h2 className="text-2xl font-bold mt-6 mb-3">Conviction NFTs</h2>
            <p className="mb-4">
              Every evolution deserves its historians. Our Conviction NFTs are automatically minted for purchases exceeding 0.1% of the total supply, capturing:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Exact evolution state at purchase time</li>
              <li>Dynamic SVG art reflecting the evolution stage</li>
              <li>On-chain proof of early participation</li>
              <li>Historical price achievement data</li>
            </ul>

            <h2 className="text-2xl font-bold mt-6 mb-3">Protocol Governance</h2>
            <p className="mb-6">
              Coming soon: the Higherrrrrrr governance token. This will put the future direction of the protocol in the hands of the community. The token will follow a community-first distribution model with 85% allocated to the community through an initial liquidity offering and multi-stage airdrops, and 15% reserved for the core team. Early participants in the protocol will be eligible for governance token allocation.
            </p>

            <h2 className="text-2xl font-bold mt-6 mb-3">Launch Points Program</h2>
            <p className="mb-4">
              To celebrate our launch and reward early believers, we're introducing a comprehensive points program:
            </p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Make your initial pledge to start earning points</li>
              <li>Generate additional points through trading activity</li>
            </ul>

            <p className="text-xl font-bold mt-6">
              We are going much, much higherrrrrrr. Join us.
            </p>
          </div>
        </div>
      </main>

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
            href="/faq"
            className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
          >
            FAQ
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
            href="https://github.com/Thrive-Point-Group/higherrrrrrr-protocol"
            target="_blank"
            className="text-green-500 hover:text-green-400 text-sm whitespace-nowrap"
          >
            GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Protocol; 