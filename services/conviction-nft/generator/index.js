const fs = require('fs').promises;
const path = require('path');
const templates = require('./templates');
const config = require('./config');

async function generateEvolution(level) {
  const content = `
    ${templates.styles(level)}
    <defs>
      <!-- Filters and patterns here -->
    </defs>
    <g class="pixel-font">
      ${templates.statsSection(level)}
      ${templates.faceFeatures(level)}
      <!-- Other sections -->
    </g>
  `;

  return templates.baseSVG(content);
}

async function generateAllEvolutions() {
  const outputDir = path.join(__dirname, '../examples');
  
  for (let level = 1; level <= 20; level++) {
    const svg = await generateEvolution(level);
    await fs.writeFile(
      path.join(outputDir, `evolution_${level}.svg`),
      svg
    );
  }
}

// Test generation
generateAllEvolutions().catch(console.error);