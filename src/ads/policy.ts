/**
 * Ad UX policy — enforced in code, driven by server flags.
 *
 * BANNED forever (not representable): interstitials, app-open ads, forced
 * full-screen takeovers.
 * ALLOWED: adaptive banners top/bottom, inline native cards in feeds,
 * dismissible bottom-third overlay on streams, opt-in rewarded only.
 *
 * `free_mode` (early testing) hides every surface.
 */
import { useQuery } from "@tanstack/react-query";

import { api } from "@/src/lib/api";

export interface AdPolicy {
  enabled: boolean;
  bannerTop: boolean;
  bannerBottom: boolean;
  nativeFeed: boolean;
  streamOverlay: boolean;
  overlayIntervalMinutes: number;
  rewarded: boolean;
}

const OFF: AdPolicy = {
  enabled: false,
  bannerTop: false,
  bannerBottom: false,
  nativeFeed: false,
  streamOverlay: false,
  overlayIntervalMinutes: 10,
  rewarded: false,
};

export function useAdPolicy(): AdPolicy {
  const { data: flags } = useQuery({ queryKey: ["flags"], queryFn: api.flags });
  if (!flags || flags.free_mode || flags.features?.games === false) return OFF;

  const ads = flags.ads ?? {};
  return {
    enabled: ads.enabled === true,
    bannerTop: ads.banner_top === true,
    bannerBottom: ads.banner_bottom === true,
    nativeFeed: ads.native_feed === true,
    streamOverlay: ads.stream_overlay === true,
    overlayIntervalMinutes: Number(ads.overlay_interval_minutes ?? 10),
    rewarded: ads.rewarded === true,
  };
}
