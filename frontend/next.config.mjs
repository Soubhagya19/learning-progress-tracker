/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_ORIGIN || 'http://localhost:8080'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
