import { useEffect, useRef } from "react";
import { trackScrollDepth } from "@/lib/meta-pixel";

export function useScrollTracking(pageName: string) {
  const tracked = useRef<Set<number>>(new Set());

  useEffect(() => {
    tracked.current = new Set();
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      [25, 50, 75, 90].forEach((depth) => {
        if (scrollPercent >= depth && !tracked.current.has(depth)) {
          tracked.current.add(depth);
          trackScrollDepth(depth, pageName);
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pageName]);
}
