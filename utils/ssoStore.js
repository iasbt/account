export const ssoTokenStore = new Map();

export const cleanupSsoTokens = () => {
  const now = Date.now();
  for (const [token, item] of ssoTokenStore.entries()) {
    if (item.expiresAt <= now) {
      ssoTokenStore.delete(token);
    }
  }
};
