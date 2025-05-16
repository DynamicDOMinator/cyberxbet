/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "red-armadillo-871677.hostingersite.com",
      "images.unsplash.com",
      "source.unsplash.com",
      "picsum.photos",
      "i.imgur.com",
    ],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "213.136.91.209",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side specific config
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer"),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
