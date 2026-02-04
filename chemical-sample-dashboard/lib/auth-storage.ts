const REMEMBER_EMAIL_KEY = "remembered_email";
const REMEMBER_ENABLED_KEY = "remember_email_enabled";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

type SecureStorage = {
  get: (options: { key: string }) => Promise<{ value?: string | null }>;
  set: (options: { key: string; value: string }) => Promise<void>;
  remove: (options: { key: string }) => Promise<void>;
};

let accessTokenCache: string | null | undefined = undefined;
let refreshTokenCache: string | null | undefined = undefined;

function resolveSecureStorage(): SecureStorage | null {
  if (typeof window === "undefined") return null;
  const cap = (window as any).Capacitor;
  if (!cap) return null;
  const isNative =
    typeof cap.isNativePlatform === "function"
      ? cap.isNativePlatform()
      : typeof cap.getPlatform === "function"
        ? cap.getPlatform() !== "web"
        : false;
  if (!isNative) return null;
  const plugins = cap.Plugins || cap.plugins || {};
  const secure = plugins.SecureStoragePlugin || plugins.SecureStorage;
  if (secure && typeof secure.get === "function") {
    return secure as SecureStorage;
  }
  return null;
}

async function readStoredValue(key: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const secure = resolveSecureStorage();
  if (secure) {
    try {
      const result = await secure.get({ key });
      return result?.value ?? null;
    } catch {
      // fallback
    }
  }
  return localStorage.getItem(key);
}

async function writeStoredValue(key: string, value: string): Promise<void> {
  if (typeof window === "undefined") return;
  const secure = resolveSecureStorage();
  if (secure) {
    try {
      await secure.set({ key, value });
      return;
    } catch {
      // fallback
    }
  }
  localStorage.setItem(key, value);
}

async function removeStoredValue(key: string): Promise<void> {
  if (typeof window === "undefined") return;
  const secure = resolveSecureStorage();
  if (secure) {
    try {
      await secure.remove({ key });
      return;
    } catch {
      // fallback
    }
  }
  localStorage.removeItem(key);
}

export async function setAccessToken(token: string | null): Promise<void> {
  accessTokenCache = token ?? null;
  if (token) {
    await writeStoredValue(ACCESS_TOKEN_KEY, token);
  } else {
    await removeStoredValue(ACCESS_TOKEN_KEY);
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (accessTokenCache !== undefined) return accessTokenCache;
  const token = await readStoredValue(ACCESS_TOKEN_KEY);
  accessTokenCache = token;
  return token;
}

export async function setRefreshToken(token: string | null): Promise<void> {
  refreshTokenCache = token ?? null;
  if (token) {
    await writeStoredValue(REFRESH_TOKEN_KEY, token);
  } else {
    await removeStoredValue(REFRESH_TOKEN_KEY);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (refreshTokenCache !== undefined) return refreshTokenCache;
  const token = await readStoredValue(REFRESH_TOKEN_KEY);
  refreshTokenCache = token;
  return token;
}

export async function clearTokens(): Promise<void> {
  accessTokenCache = null;
  refreshTokenCache = null;
  await removeStoredValue(ACCESS_TOKEN_KEY);
  await removeStoredValue(REFRESH_TOKEN_KEY);
}

export function saveRememberedEmail(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMEMBER_EMAIL_KEY, email);
  localStorage.setItem(REMEMBER_ENABLED_KEY, "1");
}

export function clearRememberedEmail(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REMEMBER_EMAIL_KEY);
  localStorage.removeItem(REMEMBER_ENABLED_KEY);
}

export function getRememberedEmail(): { enabled: boolean; email: string } {
  if (typeof window === "undefined") {
    return { enabled: false, email: "" };
  }
  const enabled = localStorage.getItem(REMEMBER_ENABLED_KEY) === "1";
  const email = localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
  return { enabled, email };
}
