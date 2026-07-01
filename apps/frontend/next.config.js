/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
    unoptimized: true,
  },
  // NEXT_PUBLIC_API_URL is used to reach the backend directly.
};

module.exports = nextConfig;
