export const casdoorConfig = {
  serverUrl: "", // 强制使用相对路径，利用 Vercel Rewrites 或 Nginx Proxy 解决跨域和混合内容问题
  clientId: import.meta.env.VITE_CASDOOR_CLIENT_ID || "2e31f2f0cac3e22dc501", 
  organizationName: import.meta.env.VITE_CASDOOR_ORGANIZATION_NAME || "built-in",
  appName: import.meta.env.VITE_CASDOOR_APP_NAME || "app-built-in", 
  redirectPath: "/callback", // 登录回调地址
};
