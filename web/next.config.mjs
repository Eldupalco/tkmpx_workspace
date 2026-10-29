/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracing: false,
  webpack: (config, { dev }) => {
    config.resolve.symlinks = false;
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
