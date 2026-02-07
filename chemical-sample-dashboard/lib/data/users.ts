import { fetchJson } from "@/lib/api";
import { buildApiQuery } from "@/lib/data-utils";
import type {
  AuthLogListResponse,
  User,
  UserCreateRequest,
  UserListResponse,
  UserUpdateRequest,
} from "@/lib/types";

export async function fetchUsers(
  limit = 50,
  cursor?: string | number
): Promise<UserListResponse> {
  const qs = buildApiQuery({ limit, cursor });
  return fetchJson<UserListResponse>(`/api/users${qs}`);
}

export async function createUser(payload: UserCreateRequest): Promise<User> {
  return fetchJson<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  userId: number,
  payload: UserUpdateRequest
): Promise<User> {
  return fetchJson<User>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(
  userId: number
): Promise<{ status: string }> {
  return fetchJson<{ status: string }>(`/api/users/${userId}`, {
    method: "DELETE",
  });
}

export async function deleteUserHard(
  userId: number
): Promise<{ status: string }> {
  return fetchJson<{ status: string }>(`/api/users/${userId}/hard`, {
    method: "DELETE",
  });
}

export async function resetUserPassword(
  userId: number,
  password: string
): Promise<{ status: string }> {
  return fetchJson<{ status: string }>(`/api/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}

export async function fetchUserAuthLogs(
  userId: number,
  limit = 10
): Promise<AuthLogListResponse> {
  const qs = buildApiQuery({ limit });
  return fetchJson<AuthLogListResponse>(
    `/api/users/${userId}/auth-logs${qs}`
  );
}

export async function deleteUserAuthLogs(
  userId: number
): Promise<{ status: string }> {
  return fetchJson<{ status: string }>(`/api/users/${userId}/auth-logs`, {
    method: "DELETE",
  });
}

export async function deleteAllUserAuthLogs(): Promise<{ status: string }> {
  return fetchJson<{ status: string }>(`/api/users/auth-logs`, {
    method: "DELETE",
  });
}
