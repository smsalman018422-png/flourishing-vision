import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { initMetaPixel, trackPageView } from "@/lib/meta-pixel";

/**
 * Mounts the Meta Pixel and fires PageView on every route change.
 * Renders nothing.
 */
export function MetaPixel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    initMetaPixel();
  }, []);

  useEffect(() => {
    // Skip the very first PageView (already fired by initMetaPixel) by checking fbq presence.
    if (typeof window === "undefined" || !window.fbq) return;
    trackPageView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
