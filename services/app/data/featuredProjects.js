const featuredProjects = [
  {
    slug: 'wen-lamboo',
    name: 'Wen Lamboo',
    ticker: '$LAMBOO',
    imageUrl: '/images/featured/wen-lamboo.png',
    description: `
      Higher community member Magpie answers Crypto's favorite question: Wen $LAMBOO?

      Hurtling into the Higher⁷-verse, Wen Lamboo is the on-chain manifestation of our collective desire for Lamboo. Local Lambotonist Magpie has mapped the road to Valhalla:

      - Purchase 420,690 tokens and begin your journey.
      - Receive a Conviction NFT of a vehicle; your first ride depends on the market cap at which you bought.
      - Send $LAMBOO Higher⁷, until all worthy hodlers can claim their very own Lamboo.

      Stay vigilant, little brainlet, or you might miss out.
    `,
    launchDate: '2025-02-01T18:00:00Z', // 1PM EST = 18:00 UTC
    website: 'https://www.lamboo.fun/',
    twitter: 'https://x.com/Lamboo_Brainlet',
    telegram: 'https://t.me/Wen_Lamboo',
    customContent: `
      <h2 class="text-xl font-bold mt-4">Tokenomics</h2>
      <p class="mt-2">
        <strong>Total Token Supply:</strong> 1B<br/>
        <strong>Treasury Allocation:</strong> 10%
      </p>
      <h2 class="text-xl font-bold mt-4">About Wen Lamboo</h2>
      <p class="mt-2">
        It all starts with a $500 bicycle (don't fade), but as pre-set MC thresholds are passed, the rides become more respectable, evolving via Higher⁷'s unique tech. 
        Your first purchase airdrops an NFT instantly, but you must manually claim subsequent evolutions on the Higher⁷ front end. Things escalate fast: blink, and you may miss out on a new steed.
      </p>
      <p class="mt-2">
        Finally, if enough smoothbrain cryptographers ape in, $LAMBOO moons. You get a $LAMBOO, your fellow degens get a $LAMBOO—and we live in $LAMBOO-TOPIA for the rest of our days.
      </p>
    `,
    status: 'coming-soon', // Status to indicate the project hasn't launched yet
    tokenAddress: null, // No token address yet
    initialPrice: null, // Price unknown until launch
    maxSupply: 1_000_000_000, // 1B tokens
    treasuryAllocation: 100_000_000, // 10% of max supply
    nftCollection: null, // Optional, if not launched
    marketCapThresholds: [
      { cap: 1000, vehicle: 'Bicycle' },
      { cap: 10000, vehicle: 'Scooter' },
      { cap: 100000, vehicle: 'Used Car' },
      { cap: 1000000, vehicle: 'Lamboo' },
    ],
    galleryImages: [
      '/images/gallery/wen-lamboo/wen-lamboo_1.jpg',
      '/images/gallery/wen-lamboo/wen-lamboo_2.jpg',
      '/images/gallery/wen-lamboo/wen-lamboo_3.jpg',
    ],
  },
];

export default featuredProjects;