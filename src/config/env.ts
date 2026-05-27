/**
 * Application Environment Configuration
 * ─────────────────────────────────────────────────────────────────
 * Single, typed source-of-truth for all runtime environment variables.
 *
 * Usage:
 *   import { config } from "@/config/env";
 *   fetch(config.apiBaseUrl + "login.php");
 *   io(config.socketUrl);
 *
 * This version uses hardcoded production defaults for the conference server.
 * No .env file is required.
 */

// ─── Raw values ──────────────────────────────────────────────────

const rawApiBase: string =
  // import.meta.env.VITE_API_BASE_URL || "http://103.249.82.251:8080/WEBSITE-backend/";
    import.meta.env.VITE_API_BASE_URL || "http://localhost/WEBSITE-backend/";
const rawSocketUrl: string =
  // import.meta.env.VITE_SOCKET_URL || "http://103.249.82.251:8012";
     import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
 
// ─── Normalisation ───────────────────────────────────────────────

/** API base URL always ends with a trailing slash. */
const apiBaseUrl = rawApiBase.endsWith("/") ? rawApiBase : `${rawApiBase}/`;

/** WebSocket server URL – strip any accidental trailing slash. */
const socketUrl = rawSocketUrl.replace(/\/$/, "");

// ─── Exports ─────────────────────────────────────────────────────

/** Typed application config – import this instead of import.meta.env directly. */
export const config = {
  /** Full URL to the PHP backend, always ends with `/`. */
  apiBaseUrl,
  /** WebSocket / Socket.IO server URL. */
  socketUrl,
  /** True only in development builds. */
  isDev: import.meta.env.DEV as boolean,
  /** True only in production builds. */
  isProd: import.meta.env.PROD as boolean,
} as const;

// Legacy named exports – kept for backwards compatibility with existing imports.
/** @deprecated Use `config.apiBaseUrl` instead. */
export const ENV_API_BASE_URL = apiBaseUrl;
/** @deprecated Use `config.socketUrl` instead. */
export const ENV_SOCKET_URL = socketUrl;
