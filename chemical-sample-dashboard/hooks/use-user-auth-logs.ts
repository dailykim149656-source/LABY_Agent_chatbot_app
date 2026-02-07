"use client";

import { useCallback, useState } from "react";
import { USE_MOCKS } from "@/lib/config";
import type { AuthLog } from "@/lib/types";
import {
  deleteAllUserAuthLogs,
  deleteUserAuthLogs,
  fetchUserAuthLogs,
} from "@/lib/data/users";

type AuthLogsState = {
  logsByUser: Record<number, AuthLog[] | undefined>;
  loadingByUser: Record<number, boolean | undefined>;
  errorByUser: Record<number, string | null | undefined>;
};

export function useUserAuthLogs() {
  const [state, setState] = useState<AuthLogsState>({
    logsByUser: {},
    loadingByUser: {},
    errorByUser: {},
  });

  const loadLogs = useCallback(async (userId: number, limit = 10) => {
    if (USE_MOCKS) return;
    setState((prev) => ({
      ...prev,
      loadingByUser: { ...prev.loadingByUser, [userId]: true },
      errorByUser: { ...prev.errorByUser, [userId]: null },
    }));
    try {
      const response = await fetchUserAuthLogs(userId, limit);
      setState((prev) => ({
        ...prev,
        logsByUser: { ...prev.logsByUser, [userId]: response.items },
        loadingByUser: { ...prev.loadingByUser, [userId]: false },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loadingByUser: { ...prev.loadingByUser, [userId]: false },
        errorByUser: {
          ...prev.errorByUser,
          [userId]:
            err instanceof Error ? err.message : "Failed to load auth logs",
        },
      }));
    }
  }, []);

  const clearLogs = useCallback(async (userId: number) => {
    await deleteUserAuthLogs(userId);
    setState((prev) => ({
      ...prev,
      logsByUser: { ...prev.logsByUser, [userId]: [] },
    }));
  }, []);

  const clearAllLogs = useCallback(async () => {
    await deleteAllUserAuthLogs();
    setState((prev) => ({
      ...prev,
      logsByUser: Object.fromEntries(
        Object.keys(prev.logsByUser).map((key) => [Number(key), []])
      ),
    }));
  }, []);

  return {
    logsByUser: state.logsByUser,
    loadingByUser: state.loadingByUser,
    errorByUser: state.errorByUser,
    loadLogs,
    clearLogs,
    clearAllLogs,
  };
}
