import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const required = {
  database: ['DATABASE_URL'],
  redis: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  helius: ['HELIUS_API_KEY', 'NEXT_PUBLIC_HELIUS_API_KEY'],
  solana: ['NEXT_PUBLIC_SOLANA_NETWORK', 'NEXT_PUBLIC_SOLANA_RPC_URL'],
  app: ['NEXT_PUBLIC_APP_URL']
};

async function validateEnvironment() {
  console.log('🔍 Validating environment...\n');
  
  // 1. Check required environment variables
  let missingVars: string[] = [];
  Object.values(required).forEach(vars => {
    vars.forEach(v => {
      if (!process.env[v]) missingVars.push(v);
    });
  });

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }

  // 2. Test Database Connection
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }

  // 3. Test Redis Connection
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    });
    await redis.ping();
    console.log('✅ Redis connection successful');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    process.exit(1);
  }

  // 4. Test Helius API
  try {
    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test',
        method: 'getHealth',
        params: []
      })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    console.log('✅ Helius API connection successful');
  } catch (error) {
    console.error('❌ Helius API connection failed:', error.message);
    process.exit(1);
  }

  // 5. Test Solana RPC
  try {
    const response = await fetch(process.env.NEXT_PUBLIC_SOLANA_RPC_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      })
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    console.log('✅ Solana RPC connection successful');
  } catch (error) {
    console.error('❌ Solana RPC connection failed:', error.message);
    process.exit(1);
  }

  console.log('\n✨ All systems operational!');
}

validateEnvironment().catch(console.error); 