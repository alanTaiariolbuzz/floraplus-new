/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/docs',
        destination: '/api-docs',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/openapi.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // 24 horas
          },
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
      },
    ];
  },
  images: {
    domains: ['localhost', 'vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  transpilePackages: ['@mui/material', '@mui/icons-material'],
  experimental: {
    serverActions: {
      // Permitir más tiempo para completar las acciones del servidor
      bodySizeLimit: '5mb',
    },
  },
  webpack: (config) => {
    // Resolver para alias @
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    };
    
    return config;
  },
}

module.exports = nextConfig;
