/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser'),
    };
    return config;
  },
  transpilePackages: ['@usecapsule/react-sdk'],
  // Disable server-side rendering
  unstable_runtimeJS: true,
  unstable_JsPreload: false,
  reactStrictMode: false
};

module.exports = nextConfig; 