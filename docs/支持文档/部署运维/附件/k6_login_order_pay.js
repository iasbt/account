import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    http_req_duration: ["p(95)<500"]
  }
};

const baseUrl = __ENV.BASE_URL || "https://www.iasbt.cloud";

export default function () {
  const loginRes = http.get(`${baseUrl}/api/rest/profiles?page=1&page_size=10`);
  check(loginRes, { "profiles ok": (r) => r.status === 200 });
  const orderRes = http.get(`${baseUrl}/api/rest/applications?page=1&page_size=10`);
  check(orderRes, { "applications ok": (r) => r.status === 200 });
  const payRes = http.get(`${baseUrl}/api/rest/user_app_access?page=1&page_size=10`);
  check(payRes, { "access ok": (r) => r.status === 200 });
  sleep(1);
}
