import { useEffect, useMemo, useRef } from "react";
import {
  getOrCreateParticipantTabId,
  getParticipantStudentId,
  type ParticipantRecord,
} from "../api/liveSessionApi";

type UseSingleParticipantTabOptions = {
  code?: string;
  sessionId?: string | number | null;
  participant?: ParticipantRecord | null;
  enabled?: boolean;
  onDuplicate?: () => void;
};

type TabLock = {
  tabId: string;
  instanceId: string;
  updatedAt: number;
  expiresAt: number;
};

const HEARTBEAT_MS = 4000;
const LOCK_TTL_MS = 12000;

function createTabId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseTabLock(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as TabLock;
  } catch {
    return null;
  }
}

function isLockActive(lock: TabLock | null) {
  return Boolean(lock && lock.expiresAt > Date.now());
}

export function useSingleParticipantTab({
  code,
  sessionId,
  participant,
  enabled = true,
  onDuplicate,
}: UseSingleParticipantTabOptions) {
  const instanceIdRef = useRef(createTabId());
  const onDuplicateRef = useRef(onDuplicate);
  const studentId = participant ? getParticipantStudentId(participant) : null;
  const lockKey = useMemo(() => {
    if (!code || sessionId === undefined || sessionId === null || studentId === null) {
      return "";
    }

    return `quiz-active-tab:${String(sessionId)}:${String(studentId)}`;
  }, [code, sessionId, studentId]);
  const channelName = lockKey ? `${lockKey}:channel` : "";

  useEffect(() => {
    onDuplicateRef.current = onDuplicate;
  }, [onDuplicate]);

  useEffect(() => {
    if (!enabled || !lockKey || typeof window === "undefined") {
      return;
    }

    const tabId = getOrCreateParticipantTabId(code ?? "", sessionId as string | number, studentId as string | number);
    const instanceId = instanceIdRef.current;
    const existingLock = parseTabLock(localStorage.getItem(lockKey));
    const channel =
      "BroadcastChannel" in window
        ? new BroadcastChannel(channelName)
        : null;

    const writeLock = () => {
      const now = Date.now();
      const nextLock: TabLock = {
        tabId,
        instanceId,
        updatedAt: now,
        expiresAt: now + LOCK_TTL_MS,
      };

      localStorage.setItem(lockKey, JSON.stringify(nextLock));
    };

    const releaseLock = () => {
      const currentLock = parseTabLock(localStorage.getItem(lockKey));
      if (currentLock?.tabId === tabId && currentLock?.instanceId === instanceId) {
        localStorage.removeItem(lockKey);
      }
    };

    const revokeThisTab = () => {
      releaseLock();
      onDuplicateRef.current?.();
    };

    const isOwnedByThisTab =
      existingLock?.tabId === tabId && existingLock?.instanceId === instanceId;

    if (isLockActive(existingLock) && !isOwnedByThisTab) {
      channel?.postMessage({ type: "takeover", tabId, instanceId });
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: lockKey,
          newValue: JSON.stringify({
            tabId,
            instanceId,
            updatedAt: Date.now(),
            expiresAt: Date.now() + LOCK_TTL_MS,
          }),
        })
      );
    }

    writeLock();
    channel?.postMessage({ type: "active", tabId, instanceId });

    const heartbeatId = window.setInterval(writeLock, HEARTBEAT_MS);
    const handleBeforeUnload = () => releaseLock();
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        writeLock();
      }
    };
    const handleChannelMessage = (event: MessageEvent<{ type?: string; tabId?: string; instanceId?: string }>) => {
      if (
        event.data?.type === "takeover" &&
        event.data.instanceId &&
        event.data.instanceId !== instanceId
      ) {
        revokeThisTab();
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== lockKey || !event.newValue) {
        return;
      }

      const nextLock = parseTabLock(event.newValue);
      if (
        nextLock?.tabId &&
        nextLock.instanceId &&
        nextLock.instanceId !== instanceId &&
        isLockActive(nextLock)
      ) {
        revokeThisTab();
      }
    };

    channel?.addEventListener("message", handleChannelMessage);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(heartbeatId);
      channel?.removeEventListener("message", handleChannelMessage);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseLock();
      channel?.close();
    };
  }, [channelName, enabled, lockKey]);
}
