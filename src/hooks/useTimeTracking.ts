import { useEffect, useRef } from "react";
import { trackCustomPageEngagement } from "@/lib/meta-pixel";

export function useTimeTracking(pageName: string) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();
    return () => {
      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      if (timeSpent >= 10) {
        trackCustomPageEngagement(pageName, timeSpent);
      }
    };
  }, [pageName]);
}
