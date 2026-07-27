import { initialServers, RESSHIN_SERVER } from "@/lib/server-list";
import { ServerTypes } from "@/types/player-types";
import { useCallback, useEffect, useState } from "react";

export function usePlayerServers({
  defaultServerIndex,
  resshin = false,
}: {
  defaultServerIndex: number;
  resshin?: boolean;
}) {
  const isEmbedded =
    typeof window !== "undefined" && window.self !== window.top;
  const serverList = [RESSHIN_SERVER, ...initialServers];

  const [servers, setServers] = useState<ServerTypes[]>(serverList);
  const [serverIndex, setServerIndex] = useState(defaultServerIndex);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [allFailed, setAllFailed] = useState(false);
  const [retryCooldown, setRetryCooldown] = useState(0);
  useEffect(() => {
    if (retryCooldown <= 0) return;

    const timer = setTimeout(() => {
      setRetryCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [retryCooldown]);

  useEffect(() => {
    if (!allFailed) return;
    setRetryCooldown(10);
  }, [allFailed]);
  function handleManualSelect(i: number) {
    if (i === playingIndex) return;
    setAllFailed(false);
    // if leaving a connected server, clear playingIndex
    if (playingIndex === serverIndex) setPlayingIndex(null);

    setServers((prev) =>
      prev.map((s, idx) => {
        if (idx === serverIndex && s.status === "connecting") {
          return { ...s, status: "available" };
        }

        if (idx === i) {
          if (s.status === "queue") return { ...s, status: "checking" };
          if (s.status === "failed") return { ...s, status: "checking" };
          if (s.status === "available") return { ...s, status: "connecting" };
          // if (s.status === "queue") return { ...s, status: "connecting" };
        }

        return s;
      }),
    );
    setServerIndex(i);
  }

  const handleServerFail = useCallback(() => {
    setServers((prev) => {
      const find = (status: string) =>
        prev.findIndex((s, i) => i !== serverIndex && s.status === status);

      const next =
        find("available") !== -1
          ? find("available")
          : find("queue") !== -1
            ? find("queue")
            : -1;

      // ✅ All servers exhausted — mark current as failed, don't update index
      if (next === -1) {
        setAllFailed(true);

        if (isEmbedded) {
          window.parent.postMessage(
            {
              type: "VIDEO_ALL_SERVERS_FAILED",
            },
            "*",
          );
        }

        return prev.map((s, i) =>
          i === serverIndex ? { ...s, status: "failed" } : s,
        );
      }

      setServerIndex(next);
      return prev.map((s, i) =>
        i === serverIndex ? { ...s, status: "failed" } : s,
      );
    });
  }, [serverIndex, isEmbedded]);

  const handleCanPlay = useCallback(() => {
    setServers((prev) =>
      prev.map((s, i) =>
        i === serverIndex ? { ...s, status: "available" } : s,
      ),
    );
    setPlayingIndex(serverIndex);
  }, [serverIndex]);

  const handleMarkConnecting = useCallback(() => {
    setServers((prev) =>
      prev.map((s, i) =>
        i === serverIndex ? { ...s, status: "connecting" } : s,
      ),
    );
  }, [serverIndex]);

  const handleMarkChecking = useCallback(() => {
    setServers((prev) =>
      prev.map((s, i) =>
        i === serverIndex && s.status === "queue"
          ? { ...s, status: "checking" }
          : s,
      ),
    );
  }, [serverIndex]);

  const handleMarkDub = useCallback(() => {
    setServers((prev) =>
      prev.map((s, i) =>
        i === serverIndex && s.status === "available"
          ? { ...s, status: "checking" }
          : s,
      ),
    );
    setPlayingIndex(null);
  }, [serverIndex]);

  const handleMarkQueue = useCallback(() => {
    setServers((prev) =>
      prev.map((s, i) =>
        i === serverIndex && s.status === "checking"
          ? { ...s, status: "queue" }
          : s,
      ),
    );
  }, [serverIndex]);
  const handleQualityChange = useCallback(() => {
    setServers((prev) =>
      prev.map((s, i) =>
        i === serverIndex ? { ...s, status: "connecting" } : s,
      ),
    );
    setPlayingIndex(null);
  }, [serverIndex]);
  const handleResetServers = useCallback(() => {
    if (retryCooldown > 0) return;
    setAllFailed(false);
    setRetryCooldown(0);
    setPlayingIndex(null);
    setServerIndex(0);
    setServers(serverList);
  }, [retryCooldown, serverList]);
  return {
    handleCanPlay,
    handleManualSelect,
    handleServerFail,
    serverIndex,
    servers,
    setServers,
    playingIndex,
    handleMarkConnecting,
    handleMarkChecking,
    handleQualityChange,
    handleMarkQueue,
    allFailed,
    handleResetServers,
    handleMarkDub,
    retryCooldown,
  };
}
