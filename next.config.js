/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    webpackBuildWorker: true,
  },
  eslint: {
    // Suppress specific warnings during build
    ignoreDuringBuilds: false,
    dirs: ['src', 'app', 'components', 'lib', 'hooks']
  },
  typescript: {
    // Don't fail build on type errors in development
    ignoreBuildErrors: false
  },
  // Suppress specific webpack warnings
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Suppress CSS compatibility warnings in development
      config.infrastructureLogging = {
        level: 'error',
      };
    }
    return config;
  },
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/photos/**',
      },
    ],
  },
  // Performance optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  // Suppress hydration warnings in development (they're fixed now)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  }
};

module.exports = nextConfig;