import { getCurrentChain } from '../components/Web3Provider';

export const WALLETCONNECT_PROJECT_ID = 'a893723ca57a205513119f91ba5c09c8';

export const RPC_URLS = {
  development: 'http://127.0.0.1:8545',
  production: 'https://rpc.higherrrrrrr.fun/'
};

export const CURRENT_RPC_URL = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? RPC_URLS.development
  : RPC_URLS.production;

export const getCurrentRpcUrl = () => {
  const chain = getCurrentChain();
  return (chain.id as number) === 31337 ? RPC_URLS.development : RPC_URLS.production;
};

// Add Uniswap V3 Quoter contract address
export const UNISWAP_QUOTER_ADDRESS = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a';

export const UNISWAP_V3_FACTORY = '0x33128a8fC17869897dcE68Ed026d694621f6FDfD';
export const WETH = '0x4200000000000000000000000000000000000006';