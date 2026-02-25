// 注册所有接入 Account 系统的子应用
// 每个应用都有独立的配置，支持不同的 Token 格式和密钥
import { config } from "./index.js";

export const APPLICATIONS = {
  // 1. Image Gallery (图库)
  // 采用 Supabase 架构，需要标准的 GoTrue JWT
  gallery: {
    appId: "gallery",
    name: "Image Gallery",
    secret: process.env.SSO_SECRET_GALLERY || "MvVh2XGOWu0axQJFoFYbocTvAXd9tZ9J3NQzAbfIz",
    // 允许的跳转域名 (Token 接收方)
    allowedOrigins: [
      "http://119.91.71.30:5173",      // 生产环境 (Vite 预览端口 - 主入口)
      "http://119.91.71.30",           // 生产环境 (IP 访问 - 兼容)
      "http://119.91.71.30:3000",      // 生产环境 (Node 默认端口)
      "http://119.91.71.30:8080",      // 生产环境 (备用端口)
      "http://localhost:5173",         // 本地开发
      "http://localhost:3000"          // 本地开发
    ],
    tokenType: "supabase", // 兼容 Supabase JWT 结构
  },

  // 2. Developer Toolbox (工具箱) - 预留
  toolbox: {
    name: "Developer Toolbox",
    id: "toolbox",
    allowedOrigins: [
      "http://119.91.71.30:3001",      // 生产环境 (IP 访问)
      "https://toolbox.iasbt.com",     // 预留域名
      "http://localhost:3001"
    ],
    tokenType: "standard",
    get secret() {
      return process.env.SSO_SECRET_TOOLBOX || config.ssoSecret;
    }
  },

  // 3. Life OS (生活系统) - 预留
  lifeos: {
    name: "Life OS",
    id: "lifeos",
    allowedOrigins: [
      "http://119.91.71.30:3002",      // 生产环境 (IP 访问)
      "https://life.iasbt.com",        // 预留域名
      "http://localhost:3002"
    ],
    tokenType: "standard",
    get secret() {
      return process.env.SSO_SECRET_LIFEOS || config.ssoSecret;
    }
  }
};

/**
 * 根据目标 URL 自动匹配应用配置
 * @param {string} targetUrl 
 * @returns {object|null} Application config or null
 */
export const matchAppByOrigin = (targetUrl) => {
  try {
    const url = new URL(targetUrl);
    const origin = url.origin; // e.g. https://gallery.iasbt.com
    
    // 遍历所有注册应用
    for (const app of Object.values(APPLICATIONS)) {
      // 检查该应用的 allowedOrigins 是否包含当前 origin
      // 支持完全匹配，也可以扩展为通配符匹配
      if (app.allowedOrigins.some(allowed => allowed === origin || allowed === targetUrl)) {
        return app;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};
