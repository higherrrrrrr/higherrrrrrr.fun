const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const glob = promisify(require('glob'));

async function buildKnowledgeBase() {
  // Go up to the root of the monorepo
  const rootDir = path.resolve(__dirname, '../../../');
  
  try {
    // Find all markdown files in the repo
    const files = await glob('**/*.md', {
      cwd: rootDir,
      ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/coverage/**']
    });

    // Read and process all files
    const docs = await Promise.all(
      files.map(async file => {
        try {
          const content = await readFile(path.join(rootDir, file), 'utf8');
          return content;
        } catch (err) {
          console.error(`Error reading ${file}:`, err);
          return '';
        }
      })
    );

    // Process and join the content
    const knowledgeBase = docs
      .filter(Boolean)
      .join('\n\n---\n\n')
      .replace(/```[^`]*```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/#{1,6}\s?/g, '') // Remove headers
      .trim();

    // Write to a JSON file that will be imported by the app
    const outputPath = path.join(__dirname, '../data/knowledge-base.json');
    await writeFile(
      outputPath,
      JSON.stringify({ content: knowledgeBase, buildTime: new Date().toISOString() })
    );

    console.log('Knowledge base built successfully!');
  } catch (error) {
    console.error('Error building knowledge base:', error);
    process.exit(1);
  }
}

buildKnowledgeBase(); 