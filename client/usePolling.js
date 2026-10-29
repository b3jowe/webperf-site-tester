import { useEffect, useRef } from 'react';

// Kör callback direkt och sedan med intervall så länge enabled är sant
export const usePolling = (callback, intervalMs, enabled = true) => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    savedCallback.current();
    const timer = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs, enabled]);
};
