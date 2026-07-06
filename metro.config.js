const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Workarounds for packaging bugs in react-native-worklets v0.8.3
 * and @expo/ui ~56.0.16:
 *
 * 1. react-native-worklets: "react-native" field → ./src/index (TS source)
 *    but src/ is missing many files (workletRuntimeEntry, etc.).
 *    Fix: redirect to compiled lib/module/ output.
 *
 * 2. @expo/ui: exports point to ./src/... (TS source) but src/ is almost
 *    entirely missing from the published package (only src/community/ exists).
 *    We created stub files in src/jetpack-compose/ to satisfy imports.
 *    Fix: ensure Metro can resolve .ts/.tsx files from those stubs.
 */

// ── Ensure Metro resolves .ts/.tsx from node_modules (needed for @expo/ui stubs) ──
config.resolver.sourceExts = [
  ...new Set([
    'ts',
    'tsx',
    ...(config.resolver.sourceExts || []),
  ]),
];

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const workletsPackageDir = path.join(__dirname, 'node_modules', 'react-native-worklets');
  const workletsSrcDir = path.join(workletsPackageDir, 'src');

  // ── Fix 1: react-native-worklets ──────────────────────────────────────────
  // Any module resolved from within worklets src/ → redirect to lib/module/
  if (context.originModulePath.startsWith(workletsSrcDir)) {
    return context.resolveRequest(
      { ...context, mainFields: ['module', 'main'] },
      moduleName,
      platform
    );
  }

  // Package entry itself
  if (
    moduleName === 'react-native-worklets' ||
    moduleName.startsWith('react-native-worklets/')
  ) {
    return context.resolveRequest(
      { ...context, mainFields: ['module', 'main'] },
      moduleName,
      platform
    );
  }

  // ── Default ───────────────────────────────────────────────────────────────
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
