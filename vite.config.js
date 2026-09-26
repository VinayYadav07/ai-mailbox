import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Vercel pe /api folder khud chalta hai.
// Laptop pe (npm run dev) ye chhota plugin api/ai.js chalata hai.
function localApi() {
  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use("/api/ai", (req, res) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
          res.setHeader("Content-Type", "application/json");
          try {
            const { runAI } = await server.ssrLoadModule("/api/ai.js");
            const { task, data } = JSON.parse(body || "{}");
            const result = await runAI(task, data);
            res.end(JSON.stringify(result));
          } catch (error) {
            res.statusCode = error.status || 500;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // .env ki AI key sirf local server ko do, browser ko nahi
  const env = loadEnv(mode, process.cwd(), "");
  ["GEMINI_API_KEY", "AI_MODEL"].forEach((key) => {
    if (env[key]) process.env[key] = env[key];
  });

  return {
    plugins: [react(), localApi()],
    define: { global: "globalThis" },
  };
});
