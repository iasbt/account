export default async function handler(req, res) {
  const base = process.env.AUTH_PROXY_TARGET || "http://119.91.71.30:3000";
  const url = new URL(req.url, `http://${req.headers.host}`);
  const target = `${base}/api/auth${url.pathname.replace(/^\/api\/auth/, "")}${url.search}`;
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() === "host") continue;
    headers[key] = value;
  }
  let body;
  if (req.method && !["GET", "HEAD"].includes(req.method)) {
    if (req.body && typeof req.body === "object") {
      body = JSON.stringify(req.body);
      headers["content-type"] = headers["content-type"] || "application/json";
    } else if (typeof req.body === "string") {
      body = req.body;
    }
  }
  const response = await fetch(target, {
    method: req.method,
    headers,
    body,
  }).catch((error) => {
    res.status(502).send(`Bad Gateway: ${error?.message || "proxy error"}`);
    return null;
  });
  if (!response) return;
  res.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  res.send(buffer);
}
