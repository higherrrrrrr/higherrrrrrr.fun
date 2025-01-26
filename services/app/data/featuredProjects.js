// data/featuredProjects.js
const featuredProjects = [
    {
      slug: 'moon-doge',
      name: 'MoonDoge',
      imageUrl: '/images/featured/moon-doge.svg',  // <---- updated!
      description: 'The ultimate Doge mission to the moon. Pup. Pup!',
      launchDate: '2025-02-20T13:00:00Z',
      website: 'https://moon-doge.io',
      twitter: 'https://twitter.com/moondoge',
      customContent: `
        <h2 class="text-xl font-bold mt-4">About MoonDoge</h2>
        <p class="mt-2">
          We are launching the most cosmic canine of all time! 
          Join our community for daily doge memes and lunar rovers.
        </p>
        <p class="mt-4">
          <strong>Roadmap:</strong>
          <ul class="list-disc list-inside ml-4 mt-1">
            <li>Q1: Meme outreach</li>
            <li>Q2: NFT drops for believers</li>
            <li>Q3: On-chain dog-park community proposals</li>
          </ul>
        </p>
      `,
    },
    {
      slug: 'pepe-god',
      name: 'PepeGod',
      imageUrl: '/images/featured/pepe-god.svg',    // <---- updated!
      description: 'Pepe ascends to immortality. The meme revolution calls!',
      launchDate: '2025-03-10T18:00:00Z',
      website: 'https://pepegod.org',
      twitter: 'https://twitter.com/pepegod',
      customContent: `
        <h2 class="text-xl font-bold mt-4">Rise of PepeGod</h2>
        <p class="mt-2">
          Pepe worship takes shape here. We plan to hold weekly worship 
          (read: creative memes) ceremonies with all of your contributions 
          minted into soulbound NFTs.
        </p>
      `,
    },
  ];
  
  export default featuredProjects;
  