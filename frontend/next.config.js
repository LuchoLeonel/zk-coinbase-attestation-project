/** @type {import('next').NextConfig} */
const TerserPlugin = require('terser-webpack-plugin');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/'),
    };

    if (!isServer) {
      config.optimization.minimizer = [
        new TerserPlugin({
          exclude: /HeartbeatWorker\.js$/,
        }),
      ];
    }

    return config;
  },
};

module.exports = nextConfig;
