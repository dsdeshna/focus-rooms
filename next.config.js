/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 14+ strictly requires explicit strings for dev origins, wildcards/regex are not permitted
  allowedDevOrigins: ['localhost:3000'],
};

module.exports = nextConfig;