/**
 * A highly resilient fetch wrapper that automatically retries upon network failures
 * (like "Failed to fetch") or transient server errors (502, 503, 504).
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  maxRetries = 3,
  delayMs = 1000
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(input, init);
      
      // If it's a transient server error, we can also retry
      const isTransientStatus = [502, 503, 504].includes(response.status);
      
      if (isTransientStatus && attempt < maxRetries) {
        attempt++;
        const nextDelay = delayMs * Math.pow(2, attempt - 1);
        console.warn(`[Client Fetch] Transient status ${response.status}. Attempt ${attempt}/${maxRetries}. Retrying in ${nextDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, nextDelay));
        continue;
      }
      
      return response;
    } catch (error: any) {
      attempt++;
      // A Network error like "Failed to fetch" is caught here
      if (attempt <= maxRetries) {
        const nextDelay = delayMs * Math.pow(2, attempt - 1);
        console.warn(`[Client Fetch] Network error: ${error?.message || error}. Attempt ${attempt}/${maxRetries}. Retrying in ${nextDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, nextDelay));
      } else {
        throw error;
      }
    }
  }
}
