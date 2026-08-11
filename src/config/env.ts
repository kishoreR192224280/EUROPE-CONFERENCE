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
 * Variables are set in the project root `.env` file.
 * See `.env.example` for the full list of options.
 */

// ─── Raw values ──────────────────────────────────────────────────

const DEFAULT_API_BASE_URL = "http://localhost/WEBSITE-backend/";
const DEFAULT_SOCKET_URL = "http://localhost:3001";

function readEnvString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const rawApiBase = readEnvString(import.meta.env.VITE_API_BASE_URL) ?? DEFAULT_API_BASE_URL;
const rawSocketUrl = readEnvString(import.meta.env.VITE_SOCKET_URL) ?? DEFAULT_SOCKET_URL;

// ─── Normalisation ───────────────────────────────────────────────

/** API base URL always ends with a trailing slash. */
const apiBaseUrl = rawApiBase.endsWith("/") ? rawApiBase : `${rawApiBase}/`;

/** WebSocket server URL – strip any accidental trailing slash. */
const socketUrl = rawSocketUrl.replace(/\/+$/, "");

// ─── Dev-time validation ─────────────────────────────────────────

if (import.meta.env.DEV) {
  if (!readEnvString(import.meta.env.VITE_API_BASE_URL)) {
    console.warn(
      "[env] VITE_API_BASE_URL is not set – falling back to localhost.\n" +
        "Create a .env file based on .env.example to configure this."
    );
  }
  if (!readEnvString(import.meta.env.VITE_SOCKET_URL)) {
    console.warn(
      "[env] VITE_SOCKET_URL is not set – falling back to localhost:3001.\n" +
        "Create a .env file based on .env.example to configure this."
    );
  }
}

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
