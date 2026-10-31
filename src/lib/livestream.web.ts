/**
 * Web stub — the RTMP camera is native-only. The stream screen renders its
 * fallback card when this is null.
 */
export const RtmpPublisherView = null;
export const requestRtmpPermissions = async () => ({ granted: false });
export type RtmpPublisherViewMethods = {
  startStream: (url: string) => void;
  stopStream: () => void;
};
export type RtmpConnectionEvent =
  | "connect"
  | "disconnect"
  | "reconnecting"
  | "connectionFailed";

/** Web: callback wrapping is a native-JSI concern; passthrough is fine. */
export const nitroCallback = <T>(fn: T): T => fn;
