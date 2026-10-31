/**
 * RTMP live camera — native implementation (iOS/Android dev builds).
 * The `.web.ts` sibling is picked by Metro for web bundles so the native
 * codegen import never reaches the browser.
 */
export { ApiVideoLiveStreamView } from "@api.video/react-native-livestream";
export type { ApiVideoLiveStreamMethods } from "@api.video/react-native-livestream";

