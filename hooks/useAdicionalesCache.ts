import { useState, useCallback } from "react";

// Estado global para el caché de adicionales
let cachedAdicionales: any[] = [];
let hasLoaded = false;

export const useAdicionalesCache = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const invalidateCache = useCallback(() => {
    hasLoaded = false;
    cachedAdicionales = [];
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const getCacheStatus = useCallback(
    () => ({
      hasLoaded,
      cachedAdicionales,
      refreshTrigger,
    }),
    [refreshTrigger]
  );

  const setCacheData = useCallback((data: any[]) => {
    cachedAdicionales = data;
    hasLoaded = true;
  }, []);

  return {
    invalidateCache,
    getCacheStatus,
    setCacheData,
    refreshTrigger,
  };
};
