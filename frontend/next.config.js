/** @type {import('next').NextConfig} */
if (!process.env.NEXT_PUBLIC_API_URL || !process.env.NEXT_PUBLIC_API_URL.trim()) {
  throw new Error('Missing required environment variable: NEXT_PUBLIC_API_URL. Please set it in your .env file.');
}
if (!process.env.BACKEND_API_URL || !process.env.BACKEND_API_URL.trim()) {
  throw new Error('Missing required environment variable: BACKEND_API_URL. Please set it in your .env file.');
}

const nextConfig = {
  // Re-enabled strict type checking and linting during builds
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;