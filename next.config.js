/** @type {import('next').NextConfig} */
const nextConfig = {
  // Moved from experimental to root level (Next.js 16)
  serverExternalPackages: ["mongoose"],
  
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // ✨ DISABILITA CACHE PER API ROUTES E PAGINE DINAMICHE
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
  
  // Turbopack config (Next.js 16+)
  turbopack: {
    // Empty config to silence webpack warning
  },
  
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    }
    return config
  }
}

module.exports = nextConfig