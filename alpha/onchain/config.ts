export const RPC_URLS = {
  development: 'http://127.0.0.1:8545',
  production: 'https://base-mainnet.g.alchemy.com/v2/l0XzuD715Z-zd21ie5dbpLKrptTuq07a'
};

export const CURRENT_RPC_URL = process.env.NODE_ENV === 'production' 
  ? RPC_URLS.production 
  : RPC_URLS.development; 