// src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  console.log("🟢 setupProxy.js 로드됨!");

  app.use(
    ["/api"], 
    createProxyMiddleware({
      target: "http://localhost:8080", // ✅ 여기 중요: /api 붙이면 안 됨
      changeOrigin: true,
      // logLevel: "debug", // 필요하면 켜라
    })
  );
};