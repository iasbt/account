// 注册所有接入 Account 系统的子应用
// 每个应用都有独立的配置，支持不同的 Token 格式和密钥
import { config } from "./index.js";

export const APPLICATIONS = {
  // 1. Image Gallery (图库)
  // 采用 Supabase 架构，需要标准的 GoTrue JWT
  gallery: {
    name: "Image Gallery",
    id: "gallery",
    // 允许的回调域名 (支持本地调试与生产环境)
    allowedOrigins: [
      "https://img.iasbt.com",
      "http://119.91.71.30:5173",
      "http://localhost:5173"
    ],
    // Token 类型: supabase (JWT with specific claims) | standard (Simple JWT)
    tokenType: "supabase",
    // 密钥: 优先使用应用专属密钥，否则回退到全局密钥
    // 注意：生产环境中 Gallery 的 JWT Secret 必须与此处一致
    get secret() {
      return process.env.SSO_SECRET_GALLERY || config.ssoSecret;
    }
  },

  // 2. Developer Toolbox (工具箱) - 预留
  toolbox: {
    name: "Developer Toolbox",
    id: "toolbox",
    allowedOrigins: [
      "https://toolbox.iasbt.com",
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
      "https://life.iasbt.com"
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
