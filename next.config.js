/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Old standalone admin pages were replaced by the per-event pages; keep their links working
  async redirects() {
    return ['zones', 'activities', 'analytics', 'leaderboard', 'participants', 'settings'].map((page) => ({
      source: `/admin/${page}`,
      destination: page === 'settings' ? '/admin/team' : '/admin/events',
      permanent: false,
    }))
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
