const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration with HMR and worklets support
 * Fixed transformer configuration to prevent bundling errors
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    platforms: ['ios', 'android', 'web'],
    resolverMainFields: ['react-native', 'browser', 'main'],
    unstable_enableSymlinks: false,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    minifierPath: require.resolve('metro-minify-terser'),
    minifierConfig: {
      // Disable minification for Reanimated debugging
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Enable HMR for all platforms
        if (req.url && req.url.includes('hot')) {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
