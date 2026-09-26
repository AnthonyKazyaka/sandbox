/**
 * Runtime configuration
 *
 * Defaults are committed here so the app always boots (including on GitHub
 * Pages, where no js/config.js exists). A developer can still drop an optional
 * js/config.js (gitignored, see js/config.example.js) to override any value.
 * The RAWG API key is normally entered in Settings and kept in localStorage.
 */

const DEFAULT_CONFIG = {
  rawg: {
    apiKey: '',
    baseUrl: 'https://api.rawg.io/api',
    rateLimit: {
      requestsPerSecond: 1,
      requestsPerMonth: 20000
    }
  },
  cache: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    maxSizeMB: 4
  },
  api: {
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  }
};

const API_KEY_STORAGE_KEY = 'gameBacklogRawgApiKey';
const PLACEHOLDER_KEYS = new Set(['', 'YOUR_RAWG_API_KEY_HERE']);

/**
 * Load optional local overrides from js/config.js; a missing file is expected.
 */
async function loadLocalOverrides() {
  try {
    const module = await import('../js/config.js');
    return module.CONFIG || {};
  } catch {
    return {};
  }
}

function mergeConfig(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    const isObject = value && typeof value === 'object' && !Array.isArray(value);
    result[key] = isObject ? mergeConfig(base[key] || {}, value) : value;
  }
  return result;
}

export const CONFIG = mergeConfig(DEFAULT_CONFIG, await loadLocalOverrides());

/**
 * RAWG API key: the one saved in Settings wins, then js/config.js.
 * Returns '' when no real key is configured.
 */
export function getRawgApiKey() {
  let stored = null;
  try {
    stored = localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode, blocked site data)
  }
  const key = String(stored ?? CONFIG.rawg.apiKey ?? '').trim();
  return PLACEHOLDER_KEYS.has(key) ? '' : key;
}

export function hasRawgApiKey() {
  return getRawgApiKey() !== '';
}

/**
 * Save (or clear, when empty) the RAWG API key for this browser.
 */
export function setRawgApiKey(key) {
  const value = String(key ?? '').trim();
  if (value) {
    localStorage.setItem(API_KEY_STORAGE_KEY, value);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}
