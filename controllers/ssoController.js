import crypto from "node:crypto";
import { config } from "../config/index.js";
import { signToken } from "../utils/token.js";
import { parseAllowlist, isHostAllowed } from "../utils/helpers.js";

export const issueSsoToken = async (req, res) => {
  const target = String(req.query.target || "");
  if (!target) {
    return res.status(400).json({ message: "目标地址不能为空" });
  }
  const authUser = req.user; // Assuming requireAuth middleware adds user
  if (!authUser) {
    return res.status(401).json({ message: "未登录" });
  }
  let url;
  try {
    url = new URL(target);
  } catch {
    return res.status(400).json({ message: "目标地址不合法" });
  }
  
  const allowlist = parseAllowlist(config.ssoRedirectAllowlist);
  if (!isHostAllowed(url.hostname, allowlist)) {
    return res.status(403).json({ message: "目标域名不允许" });
  }
  
  const token = signToken(
    {
      sub: authUser.sub,
      email: authUser.email,
      name: authUser.name,
      displayName: authUser.displayName,
      avatar: authUser.avatar,
      isAdmin: authUser.isAdmin,
      aud: url.hostname,
    },
    60 * 5
  );
  
  if (!token) {
    return res.status(500).json({ message: "SSO 未配置" });
  }
  
  url.searchParams.set("sso_token", token);
  return res.json({ url: url.toString() });
};
