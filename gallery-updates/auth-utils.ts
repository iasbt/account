import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  app_metadata?: {
    provider?: string;
    [key: string]: unknown;
  };
  aud?: string;
  created_at?: string;
}

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (!decoded.exp) return false;
    // Check if expired (exp is in seconds, Date.now() in ms)
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
