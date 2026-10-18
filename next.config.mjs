/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: import.meta.dirname,
  // Old prototype URLs keep working after the move to Next.js routes.
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/projects.html", destination: "/projects", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
    ];
  },
};

export default nextConfig;
