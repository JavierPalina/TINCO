// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary (para tus avatares)
      { protocol: "https", hostname: "res.cloudinary.com" },

      // Si seguís usando el placeholder remoto de shadcn:
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

module.exports = nextConfig;
