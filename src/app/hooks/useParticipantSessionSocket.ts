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

export type SessionUpdatePayload = {
  action?: string | null;
  status?: string | null;
  currentQuestionIndex?: number | null;
  participants?: number | null;
  timeRemainingSeconds?: number | null;
  serverNow?: string | null;
  timestamp?: number | null;
};

export type ParticipantSocketStatus = "idle" | "connecting" | "connected" | "reconnecting" | "expired";

type UseParticipantSessionSocketOptions = {
  code?: string;
  participant?: ParticipantRecord | null;
  sessionId?: string | number | null;
  enabled?: boolean;
  onForceLogout?: (payload: ForceLogoutPayload) => void;
  onConnectionExpired?: () => void;
  onSessionUpdate?: (payload: SessionUpdatePayload) => void;
};

function getSocketServerUrl() {
  return import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
}

export function useParticipantSessionSocket({
  code,
  participant,
  sessionId,
  enabled = true,
  onForceLogout,
  onConnectionExpired,
  onSessionUpdate,
}: UseParticipantSessionSocketOptions) {
  const [status, setStatus] = useState<ParticipantSocketStatus>("idle");
  const onForceLogoutRef = useRef(onForceLogout);
  const onConnectionExpiredRef = useRef(onConnectionExpired);
  const onSessionUpdateRef = useRef(onSessionUpdate);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    onForceLogoutRef.current = onForceLogout;
  }, [onForceLogout]);

  useEffect(() => {
    onConnectionExpiredRef.current = onConnectionExpired;
  }, [onConnectionExpired]);

  useEffect(() => {
    onSessionUpdateRef.current = onSessionUpdate;
  }, [onSessionUpdate]);

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

    const clearReconnectGraceTimer = () => {
      if (reconnectGraceTimer !== null) {
        window.clearTimeout(reconnectGraceTimer);
        reconnectGraceTimer = null;
      }
    };

    const joinSession = () => {
      if (hasJoined) {
        return;
      }

      hasJoined = true;
      socket.emit("student:join", joinPayload);
    };

    const handleJoined = (payload?: { socketId?: string }) => {
      clearReconnectGraceTimer();
      setStatus("connected");
      if (payload?.socketId) {
        sessionStorage.setItem(participantSocketStorageKey(code), payload.socketId);
      }
    };

    const handleForceLogout = (payload?: ForceLogoutPayload) => {
      clearReconnectGraceTimer();
      setStatus("expired");
      sessionStorage.removeItem(participantSocketStorageKey(code));
      onForceLogoutRef.current?.(payload ?? {});
    };

    const handleDisconnect = () => {
      hasJoined = false;
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

    const handleSessionUpdate = (payload?: SessionUpdatePayload) => {
      onSessionUpdateRef.current?.(payload ?? {});
    };

    const forceLogoutEvents = ["force-logout", "forceLogout", "session:force-logout"];

    setStatus("connecting");
    socket.on("connect", handleConnect);
    socket.on("reconnect", joinSession);
    socket.on("connect_error", handleConnectError);
    socket.on("student:joined", handleJoined);
    socket.on("disconnect", handleDisconnect);
    socket.on("session:update", handleSessionUpdate);
    socket.on("host-paused", handleSessionUpdate);
    forceLogoutEvents.forEach((eventName) => socket.on(eventName, handleForceLogout));

    joinSession();

    return () => {
      clearReconnectGraceTimer();
      socket.off("connect", handleConnect);
      socket.off("reconnect", joinSession);
      socket.off("connect_error", handleConnectError);
      socket.off("student:joined", handleJoined);
      socket.off("disconnect", handleDisconnect);
      socket.off("session:update", handleSessionUpdate);
      socket.off("host-paused", handleSessionUpdate);
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
