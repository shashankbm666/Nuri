/**
 * fetchWithRetry — Render free-tier resilience wrapper
 *
 * - Attaches an AbortController timeout (default 55s) to survive cold starts.
 * - Automatically retries once on network failure / timeout.
 * - Calls onSlow() if the first attempt hasn't resolved within `slowThresholdMs`
 *   (default 3000ms) — lets the UI show a "server is waking up" notice.
 */
export async function fetchWithRetry(url, options = {}, {
  timeoutMs = 55000,
  slowThresholdMs = 3000,
  onSlow = null,
  retries = 1,
} = {}) {
  let attempt = 0;
  let slowTimer = null;

  const doFetch = async () => {
    const controller = new AbortController();
    const hard = setTimeout(() => controller.abort(), timeoutMs);

    // Start slow timer only on first attempt
    if (attempt === 0 && onSlow) {
      slowTimer = setTimeout(onSlow, slowThresholdMs);
    }

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(slowTimer);
      clearTimeout(hard);
      return res;
    } catch (err) {
      clearTimeout(slowTimer);
      clearTimeout(hard);
      throw err;
    }
  };

  while (true) {
    try {
      return await doFetch();
    } catch (err) {
      attempt++;
      if (attempt > retries) throw err;
      // Brief pause before retry so we don't hammer immediately
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}
