/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/contract-address',
        destination: 'http://localhost:5000/api/contract-address',
      },
    ];
  },
};

module.exports = nextConfig;