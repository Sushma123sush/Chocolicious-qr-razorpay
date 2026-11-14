const API_BASE = "/api";
const TOKEN_KEY = "chocolicious_owner_token";

export function getOwnerToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setOwnerToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearOwnerToken() {
  localStorage.removeItem(TOKEN_KEY);
}

const AUTH_FAILED_EVENT = "chocolicious:owner-auth-failed";

export async function ownerRequest(path, options = {}) {
  const token = getOwnerToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearOwnerToken();
    window.dispatchEvent(new CustomEvent(AUTH_FAILED_EVENT));
  }

  if (!res.ok) {
    let message = `Request to ${path} failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export function onOwnerAuthFailed(handler) {
  window.addEventListener(AUTH_FAILED_EVENT, handler);
  return () => window.removeEventListener(AUTH_FAILED_EVENT, handler);
}