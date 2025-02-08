import { Octokit } from '@octokit/rest';
import knowledgeBaseData from '../data/knowledge-base.json';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function fetchMarkdownContent(path) {
  try {
    const response = await octokit.repos.getContent({
      owner: 'higherrrrrrr',
      repo: 'higherrrrrrr.fun',
      path,
    });

    if (Array.isArray(response.data)) {
      // It's a directory, recursively fetch MD files
      const promises = response.data
        .filter(item => 
          item.type === 'file' && item.name.endsWith('.md') || 
          item.type === 'dir'
        )
        .map(item => 
          item.type === 'file' ? 
            Buffer.from(item.content, 'base64').toString() :
            fetchMarkdownContent(item.path)
        );
      
      return Promise.all(promises);
    } else if (response.data.type === 'file') {
      // It's a single file
      return Buffer.from(response.data.content, 'base64').toString();
    }
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return '';
  }
}

let knowledgeBase = knowledgeBaseData.content;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// List of markdown files to fetch (we can expand this)
const DOC_PATHS = [
  'docs/TECHNICAL-DESIGN-DOCUMENT.md',
  'docs/SECURITY-POSTURE.md',
  'docs/CREATOR-GUIDE.md',
  'services/protocol/docs/TECHNICAL-DESIGN-DOCUMENT.md',
  'services/protocol/docs/SECURITY-POSTURE.md',
  // Add more paths as needed
];

async function fetchDoc(path) {
  try {
    const response = await fetch(
      `https://raw.githubusercontent.com/higherrrrrrr/higherrrrrrr.fun/main/${path}`
    );
    if (!response.ok) return '';
    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return '';
  }
}

export async function initKnowledgeBase() {
  return knowledgeBase;
}

export function getKnowledgeBase() {
  return knowledgeBase;
} 