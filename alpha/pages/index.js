import TokenPage from './token/[address]';

const FEATURED_TOKEN = "0x17e1f08f8f80a07406d4f05420512ab5f2d7f56e";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Introduction Section */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">
          Evolutionary Tokens
        </h1>
        
        <div className="space-y-6 text-lg text-green-500/80">
          <p>
            Tokens shouldn't be static. They should evolve with their communities, 
            growing and transforming as they achieve new milestones.
          </p>
          <p>
            Higherrrrrrr Protocol introduces evolutionary tokens - a new primitive where 
            a token's identity, name, and metadata autonomously evolve on-chain based on 
            its market performance and community growth.
          </p>
          <p>
            Each price milestone unlocks a new evolution, creating natural momentum and shared 
            achievements for holders. No team intervention, no off-chain voting - just pure 
            market-driven evolution.
          </p>
          <p className="text-green-500/60 text-base italic">
            Launch and trade now...
          </p>
        </div>

        {/* Divider */}
        <div className="border-b border-green-500/20 my-12"></div>

        {/* Featured Token */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Featured: First Evolutionary Token, $HARDER</h2>
        </div>
      </div>

      {/* Render Token Page */}
      <TokenPage addressProp={FEATURED_TOKEN} />
    </div>
  );
}