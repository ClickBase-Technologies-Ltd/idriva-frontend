// hooks/useSmartRefresh.ts
import { useEffect, useRef } from 'react';

export const useSmartRefresh = (callback: () => Promise<void>, isActive: boolean) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const backoffRef = useRef(30000); // Start with 30 seconds

  useEffect(() => {
    if (!isActive) return;

    const poll = async () => {
      try {
        await callback();
        // Reset backoff on success
        backoffRef.current = 30000;
      } catch (error) {
        console.error('Polling error:', error);
        // Exponential backoff on failure (max 5 minutes)
        backoffRef.current = Math.min(backoffRef.current * 2, 300000);
      }
      
      timeoutRef.current = setTimeout(poll, backoffRef.current);
    };

    poll();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, callback]);
};