import fetch from "node-fetch";

const url = "http://localhost:3000/api/auth/send-code";
const payload = {
  email: "iasbt@outlook.com",
};

async function run() {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("状态码:", response.status);
    console.log("响应体:", text);
  } catch (error) {
    console.error("测试请求失败", error);
  }
}

run();
