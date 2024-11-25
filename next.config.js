/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.optimization.minimize = true;
    return config;
  }
}

module.exports = nextConfig 