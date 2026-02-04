const REMEMBER_EMAIL_KEY = "remembered_email";
const REMEMBER_ENABLED_KEY = "remember_email_enabled";
const CSRF_TOKEN_KEY = "csrf_token";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length < 2) return null;
  return parts.pop()?.split(";").shift() ?? null;
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

export function setCsrfToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
}

export function clearCsrfToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
}

export function getCsrfToken(): string | null {
  if (typeof window === "undefined") return null;
  const cookieToken = readCookie("csrf_token");
  if (cookieToken) {
    const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
    if (stored !== cookieToken) {
      sessionStorage.setItem(CSRF_TOKEN_KEY, cookieToken);
    }
    return cookieToken;
  }
  return sessionStorage.getItem(CSRF_TOKEN_KEY);
}
