/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    remotePatterns: [],
  },
  turbopack: {
    root: path.join(__dirname, '../../'),
  },
  // NEXT_PUBLIC_API_URL is used to reach the backend directly.
};

module.exports = nextConfig;
