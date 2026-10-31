/**
 * Web stub — the RTMP camera is native-only. The stream screen renders its
 * fallback card when this is null.
 */
export const ApiVideoLiveStreamView = null;
export type ApiVideoLiveStreamMethods = {
  startStreaming: (streamKey: string, url?: string) => Promise<boolean>;
  stopStreaming: () => void;
};
