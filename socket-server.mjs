import { createServer } from "node:http";
import { Server } from "socket.io";

const PORT = Number(process.env.SOCKET_PORT || 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost/WEBSITE-backend";
const RECONNECT_GRACE_MS = Number(process.env.RECONNECT_GRACE_MS || 25000);
const ADMIN_RECONNECT_GRACE_MS = Number(process.env.ADMIN_RECONNECT_GRACE_MS || 30000);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true,
  },
});

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

  // --- Session state broadcasting (replaces HTTP polling) ---

  socket.on("session:state-change", (payload = {}) => {
    const sessionId = socket.data.adminSessionId;
    if (!sessionId) {
      return;
    }

    socket.to(`session:${sessionId}`).emit("session:update", {
      action: payload.action ?? null,
      status: payload.status ?? null,
      currentQuestionIndex: payload.currentQuestionIndex ?? null,
      participants: payload.participants ?? null,
      timeRemainingSeconds: payload.timeRemainingSeconds ?? null,
      serverNow: payload.serverNow ?? null,
      timestamp: Date.now(),
    });
  });

  socket.on("student:answer-submitted", (payload = {}) => {
    const sessionKey = socket.data.sessionKey;
    if (!sessionKey) {
      return;
    }

    const entry = activeUsers.get(sessionKey);
    if (!entry) {
      return;
    }

    socket.to(`session:${entry.sessionId}`).emit("session:answer-notify", {
      participantId: payload.participantId ?? null,
      questionId: payload.questionId ?? null,
      timestamp: Date.now(),
    });
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

httpServer.listen(PORT, () => {
  console.log(`[socket] Student session Socket.IO server listening on http://localhost:${PORT}`);
});
