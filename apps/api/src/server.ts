import Fastify from "fastify";
import compress from "@fastify/compress";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { clientKey, config } from "./config.js";
import { Poller } from "./poller.js";

const app = Fastify({ logger: true, trustProxy: config.trustProxy });
await app.register(compress, { global: true });
await app.register(cors, { origin: config.corsOrigins, methods: ["GET"] });
await app.register(rateLimit, {
  max: 120,
  timeWindow: "1 minute",
  keyGenerator: (req) => clientKey(req.headers, req.ip, config.clientIpHeader),
});

const poller = new Poller({ baseUrl: config.baseUrl, intervalMs: config.pollIntervalMs, log: app.log });

app.get("/health", async () => {
  const s = poller.snapshot;
  return {
    ok: true,
    stale: s.stale,
    count: s.count,
    fetchedAt: s.fetchedAt,
    feedTimestamp: s.feedTimestamp,
    lastError: poller.lastError,
    unknownRouteIds: poller.unknownRouteIds,
  };
});

app.get("/vehicles", async (_req, reply) => {
  reply.header("Cache-Control", "public, max-age=10");
  return poller.ready();
});

app.addHook("onClose", async () => poller.stop());
poller.start();

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
