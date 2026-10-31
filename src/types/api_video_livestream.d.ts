/**
 * Type surface for @api.video/react-native-livestream — the package ships a
 * broken `types` path so tsc can't resolve it. Mirrors its real API.
 */
declare module '@api.video/react-native-livestream' {
  import type React from 'react';
  import type { ViewStyle } from 'react-native';

  export type PredefinedResolution = '240p' | '360p' | '480p' | '720p' | '1080p';
  export type Resolution = Readonly<{ width: number; height: number }>;

  export type ApiVideoLiveStreamProps = {
    style?: ViewStyle;
    camera?: 'front' | 'back';
    video?: {
      bitrate?: number;
      fps?: number;
      resolution?: Resolution | PredefinedResolution;
      gopDuration?: number;
    };
    isMuted?: boolean;
    audio?: { bitrate?: number; sampleRate?: 5500 | 11025 | 22050 | 44100; isStereo?: boolean };
    zoomRatio?: number;
    enablePinchedZoom?: boolean;
    onConnectionSuccess?: () => void;
    onConnectionFailed?: (code: string) => void;
    onDisconnect?: () => void;
    onPermissionsDenied?: (permissions: string[]) => void;
  };

  export type ApiVideoLiveStreamMethods = {
    startStreaming: (streamKey: string, url?: string) => Promise<boolean>;
    stopStreaming: () => void;
    setZoomRatio: (zoomRatio: number) => void;
  };

  export const ApiVideoLiveStreamView: React.ForwardRefExoticComponent<
    ApiVideoLiveStreamProps & React.RefAttributes<ApiVideoLiveStreamMethods>
  >;
}
