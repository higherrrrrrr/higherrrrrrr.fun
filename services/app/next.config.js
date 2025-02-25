import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  images: {
    domains: ['*'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      }
    ]
  },
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      net: false,
      tls: false
    };
    // Add aliases to help with dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'got$': false  // Let webpack ignore got module conflicts
    };
    return config;
  },
  // Use transpilePackages for ESM compatibility
  transpilePackages: ['pg', 'react-confetti', 'react-use', '@dynamic-labs/sdk-react-core'],
};

export default nextConfig;