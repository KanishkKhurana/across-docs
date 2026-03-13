const API_BASE = 'https://app.across.to/api';
const TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1_000;

/**
 * Calls an Across API endpoint with retry and timeout.
 * Returns the parsed JSON response or null on failure.
 */
export async function callApi(method, path, params = {}) {
  const url = new URL(`${API_BASE}${path}`);
  if (method === 'GET') {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const options = {
        method,
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      };
      if (method === 'POST') {
        options.body = JSON.stringify(params);
      }

      const response = await fetch(url.toString(), options);
      clearTimeout(timer);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.warn(
          `  [${response.status}] ${method} ${path} — ${text.slice(0, 200)}`,
        );
        // Don't retry 4xx
        if (response.status >= 400 && response.status < 500) return null;
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return null;
      }

      return await response.json();
    } catch (err) {
      console.warn(
        `  Error calling ${method} ${path} (attempt ${attempt + 1}): ${err.message}`,
      );
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return null;
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
