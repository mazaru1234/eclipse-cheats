const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim().replace(/\r$/, "");
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }

  return env;
}

const appDir = __dirname;
const envFile = path.join(appDir, ".env.production");
const standaloneServer = path.join(appDir, ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServer)) {
  console.warn(
    "Warning: .next/standalone/server.js not found. Run: npm run build && bash deploy/prepare-standalone.sh"
  );
}

module.exports = {
  apps: [
    {
      name: "eclipse",
      cwd: appDir,
      script: standaloneServer,
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "0.0.0.0",
        ...loadEnvFile(envFile),
      },
    },
  ],
};
