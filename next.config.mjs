/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/rules', destination: '/#rules', permanent: true },
      { source: '/faq', destination: '/#faq', permanent: true },
      { source: '/clubs', destination: '/#clubs', permanent: true },
      { source: '/mentor', destination: '/team/login', permanent: true }
    ];
  }
};

export default nextConfig;