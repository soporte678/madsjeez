import { config } from "./config.js";
import { startServer } from "./server.js";
import { sendDesktopHeartbeat } from "./integrations/marketplace-client.js";

if (!config.enabled) {
  console.error("[atlas-desktop] JARVIS_DESKTOP_ENABLED=false");
  process.exit(1);
}

startServer();

void sendDesktopHeartbeat();
setInterval(() => void sendDesktopHeartbeat(), 60_000);
