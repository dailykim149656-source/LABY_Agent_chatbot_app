"use client";

import { useCallback, useEffect, useState } from "react";
import { USE_MOCKS } from "@/lib/config";
import type { User, UserCreateRequest, UserUpdateRequest } from "@/lib/types";
import {
  createUser as createUserApi,
  deleteUser as deleteUserApi,
  deleteUserHard as deleteUserHardApi,
  fetchUsers,
  resetUserPassword as resetUserPasswordApi,
  updateUser as updateUserApi,
} from "@/lib/data/users";

type UsersState = {
  users: User[];
  total: number;
  isLoading: boolean;
  error: string | null;
};

export function useUsers(limit = 50) {
  const [state, setState] = useState<UsersState>({
    users: [],
    total: 0,
    isLoading: false,
    error: null,
  });

  const loadUsers = useCallback(async () => {
    if (USE_MOCKS) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetchUsers(limit);
      setState({
        users: response.items,
        total: response.total,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load users",
      }));
    }
  }, [limit]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const createUser = useCallback(async (payload: UserCreateRequest) => {
    const created = await createUserApi(payload);
    setState((prev) => ({
      ...prev,
      users: [created, ...prev.users],
      total: prev.total + 1,
    }));
    return created;
  }, []);

  const updateUser = useCallback(async (userId: number, payload: UserUpdateRequest) => {
    const updated = await updateUserApi(userId, payload);
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) => (user.id === userId ? updated : user)),
    }));
    return updated;
  }, []);

  const deactivateUser = useCallback(async (userId: number) => {
    await deleteUserApi(userId);
    setState((prev) => ({
      ...prev,
      users: prev.users.map((user) =>
        user.id === userId ? { ...user, isActive: false } : user
      ),
    }));
  }, []);

  const deleteUserHard = useCallback(async (userId: number) => {
    await deleteUserHardApi(userId);
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((user) => user.id !== userId),
      total: Math.max(0, prev.total - 1),
    }));
  }, []);

  const resetUserPassword = useCallback(async (userId: number, password: string) => {
    await resetUserPasswordApi(userId, password);
  }, []);

  return {
    ...state,
    reload: loadUsers,
    createUser,
    updateUser,
    deactivateUser,
    deleteUserHard,
    resetUserPassword,
  };
}
