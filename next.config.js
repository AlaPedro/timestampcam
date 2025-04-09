/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Handle FFmpeg worker files
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: "worker-loader",
        options: {
          filename: "static/[hash].worker.js",
          publicPath: "/_next/",
        },
      },
    });

    // Handle dynamic imports in workers
    config.module.rules.push({
      test: /node_modules\/@ffmpeg/,
      use: {
        loader: "babel-loader",
        options: {
          presets: ["next/babel"],
          plugins: [["@babel/plugin-transform-runtime"]],
        },
      },
    });

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
  // Disable strict mode to avoid issues with FFmpeg
  reactStrictMode: false,
};

module.exports = nextConfig;
