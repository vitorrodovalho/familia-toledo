/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    largePageDataBytes: 256 * 1000,
  },
};

module.exports = nextConfig;
