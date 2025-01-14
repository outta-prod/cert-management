/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      {
        test: /\.svg$/i,
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        use: ["@svgr/webpack"],
      }
    );

    fileLoaderRule.exclude = /\.svg$/i;

    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    config.externals.push({
      sharp: "commonjs sharp",
      canvas: "commonjs canvas",
      "@napi-rs/canvas": "commonjs @napi-rs/canvas",
    });

    return config;
  },
};

module.exports = nextConfig;
