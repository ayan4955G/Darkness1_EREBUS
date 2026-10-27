/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // API proxying is handled by the catch-all route at app/api/[...path]/route.ts
  // which reads API_ORIGIN at request time (runtime), not at build time.
}

export default nextConfig
