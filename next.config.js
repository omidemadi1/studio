/**
 * next.config.js
 * Provide fallbacks and webpack tweaks so server-only packages don't break the client build.
 */

const nextConfig = {
  // Note: `experimental.appDir` is no longer required in newer Next.js versions
  // and causes an "Unrecognized key(s)" warning. Keep config minimal and
  // rely on the project's routing setup instead.
  webpack: (config, { isServer }) => {
    // Prevent server-only modules from being bundled for the client
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        // genkit and some tracing libs use node APIs which shouldn't be bundled client-side
        fs: false,
        tls: false,
        net: false,
        child_process: false,
        // handlebars/dotprompt use require.extensions which webpack doesn't support.
        // Provide empty fallbacks so they are not bundled into the client build.
        handlebars: false,
        '@opentelemetry/exporter-jaeger': false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
