export default function HowItWorks() {
  return (
    <div className="prose prose-invert prose-green max-w-none">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-4xl font-mono mb-8 text-green-500">How it Works?</h1>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-mono text-green-500">Evolutionary Tokens</h2>
            <p className="text-green-500">
              Traditional tokens remain static from launch, missing the dynamic energy of the communities they represent. 
              We're introducing something different - tokens that evolve and grow with their community.
            </p>
            <p className="text-green-500">
              Each price milestone unlocks a new evolution, transforming the token's fundamental properties on-chain. 
              This creates natural momentum as communities work together toward the next evolution, with each new form 
              becoming a shared achievement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-mono text-green-500">How Evolutions Work</h2>
            <p className="text-green-500">
              Every purchase moves the token closer to its next evolution. As the price reaches new milestones, 
              the token automatically transforms - its name, symbol, and identity evolve through smart contracts:
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
              Each evolution extends the arms of our friend (ツ), representing the growing reach of your community
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-mono text-green-500">Conviction NFTs</h2>
            <p className="text-green-500">
              Conviction NFTs are your proof of being an early believer. When you purchase more than 1,001,001 tokens, 
              you automatically receive a unique NFT that captures that moment in the token's evolution.
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
            <h2 className="text-2xl font-mono text-green-500">FAQ</h2>
            
            <h3 className="text-xl font-mono text-green-500 mt-6">How much does it cost to launch a token?</h3>
            <p className="text-green-500">
              Launching a token is completely free - you only pay the network's gas fees.
            </p>

            <h3 className="text-xl font-mono text-green-500 mt-6">When do I get my Conviction NFT?</h3>
            <p className="text-green-500">
              NFTs are automatically minted when you purchase more than 1,001,001 tokens in a single transaction.
            </p>

            <h3 className="text-xl font-mono text-green-500 mt-6">Who controls the evolution process?</h3>
            <p className="text-green-500">
              Everything happens automatically through smart contracts. There's no team intervention - the community's 
              trading activity directly drives evolution.
            </p>

            <h3 className="text-xl font-mono text-green-500 mt-6">What happens after the final evolution?</h3>
            <p className="text-green-500">
              The token maintains its final form but continues trading freely on the market. The achievement of reaching
              the final evolution is permanently recorded in its history.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 