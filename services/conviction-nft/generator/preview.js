const fs = require('fs');
const path = require('path');
const templates = require('../templates');

const TEST_LEVELS = 20; // Number of levels to preview
const OUTPUT_DIR = path.join(__dirname, 'preview');

async function generatePreviews() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Generating preview NFTs...');

  // Generate each level
  for (let level = 1; level <= TEST_LEVELS; level++) {
    const svg = templates.generateComplete(level);
    const filePath = path.join(OUTPUT_DIR, `level_${level}.svg`);
    
    fs.writeFileSync(filePath, svg);
    console.log(`Generated Level ${level} NFT: ${filePath}`);
  }

  // Generate an HTML preview page
  const htmlPreview = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>NFT Level Preview</title>
      <style>
        body { background: #1a1a1a; color: #fff; font-family: sans-serif; }
        .container { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; padding: 20px; }
        .nft-card { background: #2a2a2a; padding: 10px; border-radius: 10px; }
        .nft-card h3 { text-align: center; }
        img { width: 100%; height: auto; }
      </style>
    </head>
    <body>
      <h1 style="text-align: center">NFT Level Preview</h1>
      <div class="container">
        ${Array.from({length: TEST_LEVELS}, (_, i) => i + 1)
          .map(level => `
            <div class="nft-card">
              <h3>Level ${level}</h3>
              <img src="level_${level}.svg" alt="Level ${level} NFT">
            </div>
          `).join('')}
      </div>
    </body>
    </html>
  `;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'preview.html'), htmlPreview);
  console.log(`Generated preview page: ${path.join(OUTPUT_DIR, 'preview.html')}`);
}

// Run the preview generator
generatePreviews().catch(console.error);