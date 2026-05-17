/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },

  // Prevent Next.js from bundling native binaries — must run as external Node modules
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min'],

  // Tell browsers and CDN never to cache public page HTML
  async headers() {
    return [
      {
        source: '/(|events|news|gallery|about|contact|donate|join)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
