
// Generate a random string for the code verifier
export function generateCodeVerifier(length: number = 128): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  if (typeof window !== 'undefined' && window.crypto) {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      verifier += charset[randomValues[i] % charset.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      verifier += charset.charAt(Math.floor(Math.random() * charset.length));
    }
  }
  return verifier;
}

// Generate the code challenge from the verifier
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hash));
  const hashString = String.fromCharCode(...hashArray);
  const base64 = btoa(hashString);
  
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
