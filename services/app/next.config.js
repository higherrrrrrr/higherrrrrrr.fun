const path = require('path');

/** @type {import('next').NextConfig} */
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
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
  // Add this to ensure path aliases work
  experimental: {
    esmExternals: 'loose',
    serverActions: true,
  }
}

module.exports = nextConfig