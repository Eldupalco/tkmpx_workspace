/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracing: false,
  // Short addresses send the browser to the matching dashboard
  async redirects() {
    return [
      { source: '/employee', destination: '/employee/dashboard', permanent: true },
      { source: '/admin', destination: '/admin/dashboard', permanent: true },
    ];
  },
  webpack: (config, { dev }) => {
    config.resolve.symlinks = false;
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
