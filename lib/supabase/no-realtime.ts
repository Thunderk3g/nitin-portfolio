import type { RealtimeClientOptions, WebSocketLikeConstructor } from "@supabase/supabase-js";

/**
 * supabase-js constructs its Realtime client eagerly, and on runtimes without a
 * native WebSocket (Node < 22, e.g. local Node 20) that constructor throws
 * "Node.js 20 detected without native WebSocket support" — which would take
 * down every server component, server action and script that creates a
 * Supabase client. Server code here never opens a Realtime channel (the socket
 * is only created on connect()), so on such runtimes we hand Realtime a
 * transport that fails loudly only if something actually tries to connect.
 * Runtimes that do have WebSocket (Node 22+, Edge, browsers) keep the native one.
 */
class RealtimeUnavailable {
  constructor() {
    throw new Error("Supabase Realtime is not used in server code on this runtime.");
  }
}

export const serverRealtimeOptions: RealtimeClientOptions | undefined =
  typeof globalThis.WebSocket === "undefined"
    ? { transport: RealtimeUnavailable as unknown as WebSocketLikeConstructor }
    : undefined;
