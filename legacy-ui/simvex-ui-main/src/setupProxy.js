// src/setupProxy.js
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  console.log("setupProxy.js 로드됨!");

  app.use(
    ["/api"], 
    createProxyMiddleware({
      target: "http://localhost:8080", // /api 접두사 추가 금지
      changeOrigin: true,
      // logLevel: "debug", // 필요하면 켜라
    })
  );
};
