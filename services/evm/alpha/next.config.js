const path = require('path');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  images: {
    domains: ['storage.googleapis.com']
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      net: false,
      tls: false
    };
    return config;
  },
  // Add this to ensure path aliases work
  experimental: {
    esmExternals: 'loose'
  }
}

module.exports = nextConfig