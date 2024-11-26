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
    }
  }
  
  module.exports = nextConfig