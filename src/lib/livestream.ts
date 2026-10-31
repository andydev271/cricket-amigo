/**
 * RTMP live camera — native implementation (iOS/Android dev builds).
 * The `.web.ts` sibling is picked by Metro for web bundles so the native
 * codegen import never reaches the browser.
 */
export { callback as nitroCallback } from "react-native-nitro-modules";
export {
    requestRtmpPermissions,
    RtmpPublisherView
} from "react-native-nitro-rtmp-publisher";
export type {
    RtmpConnectionEvent,
    RtmpPublisherViewMethods
} from "react-native-nitro-rtmp-publisher";

