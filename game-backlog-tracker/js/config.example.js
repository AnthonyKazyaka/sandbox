/**
 * Optional local configuration override.
 * The app works without this file: defaults live in core/config.js and the
 * RAWG API key can be entered in Settings. Copy to js/config.js (gitignored)
 * only if you want to override values for local development.
 */

export const CONFIG = {
  // RAWG API Configuration
  // Get your free API key at: https://rawg.io/apidocs
  rawg: {
    apiKey: 'YOUR_RAWG_API_KEY_HERE', // Replace with your actual API key
    baseUrl: 'https://api.rawg.io/api',
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerMonth: 20000
    }
  },

  // Cache settings
  cache: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    maxSizeMB: 4
  },

  // API settings
  api: {
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second
  }
};
