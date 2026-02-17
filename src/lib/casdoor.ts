export const casdoorConfig = {
  serverUrl: import.meta.env.VITE_CASDOOR_SERVER_URL || "", 
  clientId: import.meta.env.VITE_CASDOOR_CLIENT_ID || "2e31f2f0cac3e22dc501", 
  organizationName: import.meta.env.VITE_CASDOOR_ORGANIZATION_NAME || "built-in",
  appName: import.meta.env.VITE_CASDOOR_APP_NAME || "app-built-in", 
  redirectPath: "/callback", // 登录回调地址
};
