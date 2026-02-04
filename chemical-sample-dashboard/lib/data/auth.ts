import { fetchJson } from "@/lib/api";
import {
  clearTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth-storage";
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  User,
  UserSelfUpdateRequest,
} from "@/lib/types";

async function persistTokens(response: LoginResponse): Promise<void> {
  if (response.access_token) {
    await setAccessToken(response.access_token);
  }
  if (response.refresh_token) {
    await setRefreshToken(response.refresh_token);
  }
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const response = await fetchJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await persistTokens(response);
  return response;
}

export async function signup(payload: SignupRequest): Promise<LoginResponse> {
  const response = await fetchJson<LoginResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  await persistTokens(response);
  return response;
}

export async function devLogin(): Promise<LoginResponse> {
  const devSecret = process.env.NEXT_PUBLIC_DEV_LOGIN_SECRET;
  const response = await fetchJson<LoginResponse>("/api/auth/dev-login", {
    method: "POST",
    headers: devSecret ? { "X-Dev-Login-Secret": devSecret } : undefined,
  });
  await persistTokens(response);
  return response;
}

export async function fetchCurrentUser(): Promise<User> {
  return fetchJson<User>("/api/auth/me");
}

export async function logout(): Promise<{ status: string }> {
  const refreshToken = await getRefreshToken();
  try {
    return await fetchJson<{ status: string }>("/api/auth/logout", {
      method: "POST",
      body: refreshToken
        ? JSON.stringify({ refresh_token: refreshToken })
        : undefined,
    });
  } finally {
    await clearTokens();
  }
}

export async function updateProfile(
  payload: UserSelfUpdateRequest
): Promise<User> {
  return fetchJson<User>("/api/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAccount(): Promise<{ status: string }> {
  try {
    return await fetchJson<{ status: string }>("/api/auth/me", {
      method: "DELETE",
    });
  } finally {
    await clearTokens();
  }
}
