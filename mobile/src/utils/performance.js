/**
 * Utilità per ottimizzazioni performance
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Hook per debounce di funzioni
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook per throttle di funzioni
 */
export const useThrottle = (callback, delay = 1000) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * Memoizza calcoli pesanti
 */
export const useMemoizedCalculation = (data, calculation) => {
  return useMemo(() => {
    if (!data || data.length === 0) return null;
    return calculation(data);
  }, [data, calculation]);
};

/**
 * Cache semplice per dati
 */
class SimpleCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minuti default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

export const dataCache = new SimpleCache();

/**
 * Utility per lazy loading di immagini
 */
export const prefetchImage = async (uri) => {
  try {
    // Placeholder per prefetch immagini
    return { success: true };
  } catch (error) {
    console.error('Errore prefetch immagine:', error);
    return { success: false, error };
  }
};

