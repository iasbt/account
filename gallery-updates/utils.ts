import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(error: unknown, defaultMessage = '操作失败，请稍后重试'): string {
  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as {
      message?: string;
      error_description?: string;
      data?: { error?: string };
    };
    return err.message || err.error_description || err.data?.error || defaultMessage;
  }

  return defaultMessage;
}

type SearchableImage = {
  id: string;
  title?: string | null;
  description?: string | null;
  exif?:
    | {
        gps?: {
          city?: string | null;
          country?: string | null;
        };
      }
    | null;
};

export function buildSearchableTextMap(items: SearchableImage[]): Map<string, string> {
  const map = new Map<string, string>();
  items.forEach((item) => {
    const text = [
      item.title,
      item.description,
      item.exif?.gps?.city,
      item.exif?.gps?.country,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    map.set(item.id, text);
  });
  return map;
}

export async function redirectToAuth() {
  const accountUrl = import.meta.env.VITE_ACCOUNT_URL;
  if (!accountUrl) return;

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem('pkce_verifier', verifier);

  const baseUrl = accountUrl.replace(/\/$/, '');
  const redirectUri = `${window.location.origin}/auth/callback`;
  const clientId = import.meta.env.VITE_CLIENT_ID || 'gallery-client';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${baseUrl}/api/oauth/authorize?${params.toString()}`;
}

/**
 * @deprecated Use redirectToAuth() instead
 */
export function getAuthUrl() {
  redirectToAuth();
  return '#';
}

export function getLogoutUrl() {
  // Account System (JWT based) does not have a server-side session to clear.
  // Returning empty string triggers client-side local logout and redirect to /signin.
  return '';
}
