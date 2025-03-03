#!/usr/bin/env node
import { jupiterIndexer } from '../lib/jupiter/transactionIndexer.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Make sure the HELIUS_API_KEY is set
if (!process.env.HELIUS_API_KEY) {
  console.error('ERROR: HELIUS_API_KEY environment variable is required');
  process.exit(1);
}

// Make sure the HELIUS_RPC_URL is set
if (!process.env.HELIUS_RPC_URL) {
  console.error('ERROR: HELIUS_RPC_URL environment variable is required');
  process.exit(1);
}

console.log('Using Helius RPC URL:', process.env.HELIUS_RPC_URL);

// Handle process termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down...');
  jupiterIndexer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down...');
  jupiterIndexer.stop();
  process.exit(0);
});

// Start the indexer
jupiterIndexer.start();

console.log('Jupiter Indexer worker started. Press Ctrl+C to stop.'); 