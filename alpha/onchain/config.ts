import { getCurrentChain } from '../components/Web3Provider';

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
  return chain.id === 31337 ? RPC_URLS.development : RPC_URLS.production;
};