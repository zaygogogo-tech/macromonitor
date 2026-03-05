// SWR (Stale-While-Validate) implementation for graceful degradation
export interface SWRCache<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isStale: boolean;
  lastUpdated: number | null;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache storage
const cacheStore = new Map<string, CacheEntry<unknown>>();

// Default cache duration: 5 minutes
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;

export async function fetchWithSWR<T>(
  url: string,
  options?: {
    cacheDuration?: number;
    retries?: number;
  }
): Promise<SWRCache<T>> {
  const cacheKey = url;
  const cacheDuration = options?.cacheDuration ?? DEFAULT_CACHE_DURATION;
  const maxRetries = options?.retries ?? 2;
  
  const cached = cacheStore.get(cacheKey) as CacheEntry<T> | undefined;
  const now = Date.now();
  const isStale = !cached || (now - cached.timestamp) > cacheDuration;

  // Return stale data immediately while revalidating
  const result: SWRCache<T> = {
    data: cached?.data ?? null,
    error: null,
    isLoading: true,
    isStale: isStale || !!cached,
    lastUpdated: cached?.timestamp ?? null,
  };

  // Attempt to fetch fresh data
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      const newData = json.data ?? json;
      
      // Update cache
      cacheStore.set(cacheKey, {
        data: newData,
        timestamp: now,
      });

      return {
        data: newData,
        error: null,
        isLoading: false,
        isStale: false,
        lastUpdated: now,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
      }
    }
  }

  // All retries failed - return cached data with error flag
  return {
    data: cached?.data ?? null,
    error: lastError,
    isLoading: false,
    isStale: true,
    lastUpdated: cached?.timestamp ?? null,
  };
}

// Svelte store-compatible reactive fetch hook
export function createSWRStore<T>(url: string, options?: { cacheDuration?: number; refreshInterval?: number }) {
  let state: SWRCache<T> = {
    data: null,
    error: null,
    isLoading: true,
    isStale: false,
    lastUpdated: null,
  };

  const listeners = new Set<(state: SWRCache<T>) => void>();

  function notify() {
    listeners.forEach(fn => fn(state));
  }

  function setState(newState: Partial<SWRCache<T>>) {
    state = { ...state, ...newState };
    notify();
  }

  async function refresh() {
    setState({ isLoading: true });
    
    const result = await fetchWithSWR<T>(url, options);
    setState(result);
  }

  // Initial fetch
  refresh();

  // Optional auto-refresh
  let intervalId: ReturnType<typeof setInterval> | null = null;
  if (options?.refreshInterval) {
    intervalId = setInterval(refresh, options.refreshInterval);
  }

  return {
    subscribe(fn: (state: SWRCache<T>) => void) {
      listeners.add(fn);
      fn(state); // Initial call
      
      return () => {
        listeners.delete(fn);
        if (intervalId) clearInterval(intervalId);
      };
    },
    refresh,
    getState() {
      return state;
    },
  };
}

// Clear cache utility
export function clearSWRCache() {
  cacheStore.clear();
}
