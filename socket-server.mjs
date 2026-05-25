import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = Number(process.env.SOCKET_PORT || 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost/WEBSITE-backend";
const RECONNECT_GRACE_MS = Number(process.env.RECONNECT_GRACE_MS || 25000);
const ADMIN_RECONNECT_GRACE_MS = Number(process.env.ADMIN_RECONNECT_GRACE_MS || 30000);

const httpServer = createServer((req, res) => {
  // CORS for HTTP endpoints
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Internal routes for PHP to broadcast socket events
  if (req.method === "POST" && req.url?.startsWith("/internal/")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { sessionId } = payload;

        if (!sessionId) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Missing sessionId" }));
          return;
        }

        const room = `session:${sessionId}`;

        if (req.url === "/internal/broadcast-state-change") {
          io.to(room).emit("session:state-changed", payload);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, event: "session:state-changed", room }));
        } else if (req.url === "/internal/broadcast-leaderboard") {
          // Separate leaderboard push so state transitions are instant and
          // the (potentially large) leaderboard payload follows asynchronously.
          io.to(room).emit("session:leaderboard", payload);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, event: "session:leaderboard", room }));
        } else if (req.url === "/internal/broadcast-answer-notify") {
          batcher.queue(room, "session:answer-count", payload, 500);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, event: "session:answer-count", room, batched: true }));
        } else if (req.url === "/internal/broadcast-participant-joined") {
          batcher.queue(room, "session:participant-joined", payload, 500);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true, event: "session:participant-joined", room, batched: true }));
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Not found" }));
        }
      } catch (err) {
        console.error("[socket] Internal HTTP Error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true,
  },
});

class SessionEventBatcher {
  constructor(io) {
    this.io = io;
    this.queues = new Map(); // room -> Map(event -> payload)
    this.timers = new Map(); // room -> intervalId
  }

  queue(room, event, payload, flushIntervalMs = 500) {
    if (!this.queues.has(room)) {
      this.queues.set(room, new Map());
    }
    
    // Latest payload wins for absolute counts
    this.queues.get(room).set(event, payload);

    if (!this.timers.has(room)) {
      this.timers.set(room, setInterval(() => this.flush(room), flushIntervalMs));
    }
  }

  flush(room) {
    const roomSet = this.io.sockets.adapter.rooms.get(room);
    if (!roomSet || roomSet.size === 0) {
      this.cleanup(room);
      return;
    }

    const events = this.queues.get(room);
    if (!events || events.size === 0) return;

    for (const [event, payload] of events.entries()) {
      this.io.to(room).emit(event, payload);
    }
    events.clear();
  }

  cleanup(room) {
    const timer = this.timers.get(room);
    if (timer) clearInterval(timer);
    this.timers.delete(room);
    this.queues.delete(room);
  }
}

const batcher = new SessionEventBatcher(io);

const activeUsers = new Map();
const activeAdmins = new Map();

function normalizeBackendUrl(path) {
  return `${BACKEND_URL.replace(/\/$/, "")}/${path}`;
}

function postBackend(path, payload) {
  fetch(normalizeBackendUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((error) => {
    console.warn(`[socket] Backend sync failed for ${path}:`, error instanceof Error ? error.message : error);
  });
}

function clearRemovalTimer(entry) {
  if (entry?.removalTimer) {
    clearTimeout(entry.removalTimer);
    entry.removalTimer = null;
  }
}

io.on("connection", (socket) => {
  socket.on("admin:join", async (payload = {}) => {
    const sessionId = String(payload.sessionId ?? "").trim();
    if (!sessionId) {
      socket.emit("admin:join-error", { message: "Invalid admin session payload" });
      return;
    }

    const existing = activeAdmins.get(sessionId);
    if (existing?.pauseTimer) {
      clearTimeout(existing.pauseTimer);
    }

    if (existing?.socketId && existing.socketId !== socket.id) {
      const previousSocket = io.sockets.sockets.get(existing.socketId);
      if (previousSocket?.connected) {
        previousSocket.disconnect(true);
      }
    }

    const nextEntry = {
      socketId: socket.id,
      sessionId,
      pauseTimer: null,
    };

    activeAdmins.set(sessionId, nextEntry);
    socket.data.adminSessionId = sessionId;
    socket.join(`session:${sessionId}`);

    await postBackend("update_host_connection.php", {
      sessionId,
      connectionStatus: "connected",
      action: "heartbeat",
    });

    socket.emit("admin:joined", {
      socketId: socket.id,
      sessionId,
      reconnectGraceMs: ADMIN_RECONNECT_GRACE_MS,
    });
  });

  socket.on("student:join", async (payload = {}) => {
    const sessionId = String(payload.sessionId ?? "").trim();
    const studentId = String(payload.studentId ?? "").trim();
    const sessionKey = String(payload.sessionKey ?? `${sessionId}-${studentId}`).trim();
    const participantToken = String(payload.participantToken ?? "").trim();
    const tabId = String(payload.tabId ?? "").trim();

    if (!sessionId || !studentId || !sessionKey || !participantToken || !tabId) {
      socket.emit("student:join-error", { message: "Invalid student session payload" });
      return;
    }

    const existing = activeUsers.get(sessionKey);
    if (existing && existing.socketId !== socket.id) {
      clearRemovalTimer(existing);
      const previousSocket = io.sockets.sockets.get(existing.socketId);
      const canResumeGracefully =
        !previousSocket &&
        existing.disconnectedAt &&
        Date.now() - existing.disconnectedAt <= RECONNECT_GRACE_MS &&
        existing.participantToken === participantToken;

      if (previousSocket && previousSocket.connected) {
        previousSocket.emit("force-logout", {
          reason: "duplicate-login",
          message: "Your account was logged in from another device.",
        });
        previousSocket.disconnect(true);
      } else if (!canResumeGracefully) {
        activeUsers.delete(sessionKey);
      }
    }

    const nextEntry = {
      socketId: socket.id,
      sessionId,
      studentId,
      sessionKey,
      participantToken,
      tabId,
      disconnectedAt: null,
      removalTimer: null,
    };

    activeUsers.set(sessionKey, nextEntry);
    socket.data.sessionKey = sessionKey;
    socket.data.participantToken = participantToken;
    socket.join(`session:${sessionId}`);

    await postBackend("register_student_socket.php", {
      participantToken,
      sessionId,
      studentId,
      socketId: socket.id,
    });

    socket.emit("student:joined", {
      socketId: socket.id,
      sessionKey,
      tabId,
      reconnectGraceMs: RECONNECT_GRACE_MS,
    });
  });

  // --- Session state broadcasting (admin → students) ---
  // NOTE: This handler is intentionally REMOVED. Admin actions trigger PHP
  // which calls /internal/broadcast-state-change. Having the admin client
  // also emit session:state-change here caused students to receive every
  // state transition TWICE. PHP is the sole broadcast source.

  // --- Student heartbeat ---
  // Students emit this every 30s while connected. We update lastSeen in
  // memory only — zero DB queries, zero PHP calls.
  socket.on("heartbeat", (payload) => {
    const sessionKey = payload?.sessionKey ?? socket.data.sessionKey;
    if (!sessionKey) return;

    const entry = activeUsers.get(sessionKey);
    if (entry && entry.socketId === socket.id) {
      entry.lastSeen = Date.now();
      activeUsers.set(sessionKey, entry);
    }
  });

  socket.on("display:join", (payload = {}) => {
    const sessionId = String(payload.sessionId ?? "").trim();
    if (!sessionId) {
      return;
    }

    socket.data.displaySessionId = sessionId;
    socket.join(`session:${sessionId}`);
    socket.emit("display:joined", { socketId: socket.id, sessionId });
  });

  // --- Disconnect handling ---

  socket.on("disconnect", () => {
    const adminSessionId = socket.data.adminSessionId;
    if (adminSessionId) {
      const entry = activeAdmins.get(adminSessionId);
      if (!entry || entry.socketId !== socket.id) {
        return;
      }

      void postBackend("update_host_connection.php", {
        sessionId: adminSessionId,
        connectionStatus: "reconnecting",
        action: "heartbeat",
      });

      entry.pauseTimer = setTimeout(() => {
        const latest = activeAdmins.get(adminSessionId);
        if (latest?.socketId === socket.id) {
          activeAdmins.delete(adminSessionId);
          io.to(`session:${adminSessionId}`).emit("host-paused", {
            sessionId: adminSessionId,
            message: "The host disconnected. The quiz has been paused safely.",
          });
          void postBackend("update_host_connection.php", {
            sessionId: adminSessionId,
            connectionStatus: "disconnected",
            action: "pause",
            reason: "Host disconnected for more than 30 seconds",
          });
        }
      }, ADMIN_RECONNECT_GRACE_MS);

      activeAdmins.set(adminSessionId, entry);
      return;
    }

    const sessionKey = socket.data.sessionKey;
    if (!sessionKey) {
      return;
    }

    const entry = activeUsers.get(sessionKey);
    if (!entry || entry.socketId !== socket.id) {
      return;
    }

    entry.disconnectedAt = Date.now();
    entry.removalTimer = setTimeout(() => {
      const latest = activeUsers.get(sessionKey);
      if (latest?.socketId === socket.id) {
        activeUsers.delete(sessionKey);
        void postBackend("mark_student_socket_disconnected.php", {
          participantToken: entry.participantToken,
          socketId: socket.id,
          connectionStatus: "disconnected",
          lastSocketError: "Reconnect grace period expired",
        });
      }
    }, RECONNECT_GRACE_MS);
    activeUsers.set(sessionKey, entry);

    void postBackend("mark_student_socket_disconnected.php", {
      participantToken: entry.participantToken,
      socketId: socket.id,
      connectionStatus: "reconnecting",
    });
  });
});

setInterval(() => {
  const roomSizes = {};
  for (const [room, sockets] of io.sockets.adapter.rooms.entries()) {
    // Only log session rooms (skip socket-id rooms which match their own socketId)
    if (room.startsWith("session:")) {
      roomSizes[room] = sockets.size;
    }
  }
  console.log({
    clients: io.engine.clientsCount,
    activeStudents: activeUsers.size,
    activeAdmins: activeAdmins.size,
    sessionRooms: roomSizes,
    memory: process.memoryUsage(),
  });
}, 30_000);

httpServer.listen(PORT, () => {
  console.log(`[socket] Student session Socket.IO server listening on http://localhost:${PORT}`);
});