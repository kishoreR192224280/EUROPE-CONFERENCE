import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  getOrCreateParticipantTabId,
  getParticipantStudentId,
  participantSocketStorageKey,
  studentSessionSocketKey,
  type ParticipantRecord,
} from "../api/liveSessionApi";

type ForceLogoutPayload = {
  message?: string;
  reason?: string;
};

import type { Session } from "../context/SessionContext";

export type SessionUpdatePayload = Partial<Session> & {
  action?: string | null;
  timestamp?: number | null;
  answeredParticipants?: number;
  totalParticipants?: number;
  questionId?: number | string | null;
};

export type ParticipantSocketStatus = "idle" | "connecting" | "connected" | "reconnecting" | "expired";

type UseParticipantSessionSocketOptions = {
  code?: string;
  participant?: ParticipantRecord | null;
  sessionId?: string | number | null;
  enabled?: boolean;
  onForceLogout?: (payload: ForceLogoutPayload) => void;
  onConnectionExpired?: () => void;
  /** Called for full state-change events (question change, status change, pause/resume). */
  onSessionUpdate?: (payload: SessionUpdatePayload) => void;
  /** Called for lightweight participant-count-only updates. */
  onParticipantUpdate?: (count: number) => void;
  /** Called for lightweight answer-count updates (admin-side only — students rarely need this). */
  onAnswerCountUpdate?: (answeredParticipants: number, totalParticipants: number) => void;
};

import { ENV_SOCKET_URL } from "../../config/env";

function getSocketServerUrl() {
  return ENV_SOCKET_URL;
}

/** How often (ms) the client sends a heartbeat to the socket server while connected. */
const HEARTBEAT_INTERVAL_MS = 30_000;

export function useParticipantSessionSocket({
  code,
  participant,
  sessionId,
  enabled = true,
  onForceLogout,
  onConnectionExpired,
  onSessionUpdate,
  onParticipantUpdate,
  onAnswerCountUpdate,
}: UseParticipantSessionSocketOptions) {
  const [status, setStatus] = useState<ParticipantSocketStatus>("idle");

  // Keep callback refs stable so we don't need to put them in the effect deps array
  const onForceLogoutRef = useRef(onForceLogout);
  const onConnectionExpiredRef = useRef(onConnectionExpired);
  const onSessionUpdateRef = useRef(onSessionUpdate);
  const onParticipantUpdateRef = useRef(onParticipantUpdate);
  const onAnswerCountUpdateRef = useRef(onAnswerCountUpdate);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => { onForceLogoutRef.current = onForceLogout; }, [onForceLogout]);
  useEffect(() => { onConnectionExpiredRef.current = onConnectionExpired; }, [onConnectionExpired]);
  useEffect(() => { onSessionUpdateRef.current = onSessionUpdate; }, [onSessionUpdate]);
  useEffect(() => { onParticipantUpdateRef.current = onParticipantUpdate; }, [onParticipantUpdate]);
  useEffect(() => { onAnswerCountUpdateRef.current = onAnswerCountUpdate; }, [onAnswerCountUpdate]);

  useEffect(() => {
    if (!enabled || !code || !participant || sessionId === undefined || sessionId === null) {
      setStatus("idle");
      socketRef.current = null;
      return;
    }

    if (typeof window === "undefined") {
      setStatus("idle");
      return;
    }

    const studentId = getParticipantStudentId(participant);
    const sessionKey = studentSessionSocketKey(sessionId, studentId);
    const tabId = getOrCreateParticipantTabId(code, sessionId, studentId);
    const joinPayload = {
      code: code.toUpperCase(),
      sessionId,
      studentId,
      tabId,
      sessionKey,
      participantToken: participant.token,
      participantId: participant.id,
      participantName: participant.name,
      phoneNumber: participant.phoneNumber,
    };

    const socket: Socket = io(getSocketServerUrl(), {
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    let hasJoined = false;
    let reconnectGraceTimer: number | null = null;
    let heartbeatTimer: number | null = null;

    const clearReconnectGraceTimer = () => {
      if (reconnectGraceTimer !== null) {
        window.clearTimeout(reconnectGraceTimer);
        reconnectGraceTimer = null;
      }
    };

    const stopHeartbeat = () => {
      if (heartbeatTimer !== null) {
        window.clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const startHeartbeat = () => {
      stopHeartbeat();
      heartbeatTimer = window.setInterval(() => {
        // Lightweight ping so the socket server can update lastSeen for this
        // student without any PHP or DB round-trip. The server just updates
        // the in-memory activeUsers entry.
        socket.emit("heartbeat", { sessionKey, sessionId });
      }, HEARTBEAT_INTERVAL_MS);
    };

    const joinSession = () => {
      if (hasJoined) return;
      hasJoined = true;
      socket.emit("student:join", joinPayload);
    };

    const handleJoined = (payload?: { socketId?: string }) => {
      clearReconnectGraceTimer();
      setStatus("connected");
      startHeartbeat();
      if (payload?.socketId) {
        sessionStorage.setItem(participantSocketStorageKey(code), payload.socketId);
      }
    };

    const handleForceLogout = (payload?: ForceLogoutPayload) => {
      clearReconnectGraceTimer();
      stopHeartbeat();
      setStatus("expired");
      sessionStorage.removeItem(participantSocketStorageKey(code));
      onForceLogoutRef.current?.(payload ?? {});
    };

    const handleDisconnect = () => {
      hasJoined = false;
      stopHeartbeat();
      sessionStorage.removeItem(participantSocketStorageKey(code));
      setStatus("reconnecting");
      clearReconnectGraceTimer();
      reconnectGraceTimer = window.setTimeout(() => {
        setStatus("expired");
        onConnectionExpiredRef.current?.();
      }, 25000);
    };

    const handleConnect = () => {
      setStatus("connecting");
      joinSession();
    };

    const handleConnectError = () => {
      setStatus((currentStatus) => (currentStatus === "connected" ? "reconnecting" : "connecting"));
    };

    /**
     * Full state-change events: question transitions, status changes, pauses, resumes.
     * These carry the lightweight payload from build_lightweight_state_payload()
     * and may include currentQuestionId, status, timeRemainingSeconds, etc.
     */
    const handleSessionStateChanged = (payload?: SessionUpdatePayload) => {
      onSessionUpdateRef.current?.(payload ?? {});
    };

    /**
     * Participant-count-only events: a new student joined the session.
     * Route to the lightweight handler if provided; fall back to the full
     * session updater so callers that haven't opted in still work.
     */
    const handleParticipantJoined = (payload?: { participants?: number; totalParticipants?: number }) => {
      const count = payload?.participants ?? payload?.totalParticipants;
      if (count !== undefined && onParticipantUpdateRef.current) {
        onParticipantUpdateRef.current(count);
      } else {
        // Fallback: pass through to generic session updater
        onSessionUpdateRef.current?.(payload ?? {});
      }
    };

    /**
     * Answer-count-only events: a student submitted an answer.
     * Route to the lightweight handler if provided; skip entirely for students
     * (they don't need to know the class answer count while answering).
     */
    const handleAnswerCount = (payload?: { answeredParticipants?: number; totalParticipants?: number }) => {
      const answered = payload?.answeredParticipants ?? 0;
      const total = payload?.totalParticipants ?? answered;
      if (onAnswerCountUpdateRef.current) {
        onAnswerCountUpdateRef.current(answered, total);
      }
      // Students do NOT need answer-count updates — no fallback to onSessionUpdate
    };

    /**
     * Leaderboard push (separate from state-change for performance).
     * PHP sends this after leaderboard/ended transitions so the status
     * change arrives instantly and leaderboard data follows asynchronously.
     */
    const handleLeaderboard = (payload?: { leaderboard?: unknown[] }) => {
      if (payload?.leaderboard) {
        onSessionUpdateRef.current?.({ leaderboard: payload.leaderboard as any[] });
      }
    };

    /**
     * Host paused: treated as a full state event since it changes session.status.
     */
    const handleHostPaused = (payload?: SessionUpdatePayload) => {
      onSessionUpdateRef.current?.(payload ?? {});
    };

    const forceLogoutEvents = ["force-logout", "forceLogout", "session:force-logout"];

    setStatus("connecting");
    socket.on("connect", handleConnect);
    socket.on("reconnect", joinSession);
    socket.on("connect_error", handleConnectError);
    socket.on("student:joined", handleJoined);
    socket.on("disconnect", handleDisconnect);
    // Full state transitions (PHP webhook → socket server → all clients)
    socket.on("session:state-changed", handleSessionStateChanged);
    // Legacy alias kept for backwards compat with older socket server versions
    socket.on("session:update", handleSessionStateChanged);
    // Lightweight count-only events
    socket.on("session:participant-joined", handleParticipantJoined);
    socket.on("session:answer-count", handleAnswerCount);
    // Leaderboard push (separate event for performance)
    socket.on("session:leaderboard", handleLeaderboard);
    // Host disconnected
    socket.on("host-paused", handleHostPaused);
    forceLogoutEvents.forEach((eventName) => socket.on(eventName, handleForceLogout));

    joinSession();

    return () => {
      clearReconnectGraceTimer();
      stopHeartbeat();
      socket.off("connect", handleConnect);
      socket.off("reconnect", joinSession);
      socket.off("connect_error", handleConnectError);
      socket.off("student:joined", handleJoined);
      socket.off("disconnect", handleDisconnect);
      socket.off("session:state-changed", handleSessionStateChanged);
      socket.off("session:update", handleSessionStateChanged);
      socket.off("session:participant-joined", handleParticipantJoined);
      socket.off("session:answer-count", handleAnswerCount);
      socket.off("session:leaderboard", handleLeaderboard);
      socket.off("host-paused", handleHostPaused);
      forceLogoutEvents.forEach((eventName) => socket.off(eventName, handleForceLogout));
      sessionStorage.removeItem(participantSocketStorageKey(code));
      socket.disconnect();
      socketRef.current = null;
      setStatus("idle");
    };
  }, [code, enabled, participant, sessionId]);

  const emit = useCallback((event: string, data?: Record<string, unknown>) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    status,
    isConnected: status === "connected",
    isReconnecting: status === "reconnecting" || status === "connecting",
    isExpired: status === "expired",
    emit,
  };
}
