/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },

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
