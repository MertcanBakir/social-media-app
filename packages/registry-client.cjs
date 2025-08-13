// packages/registry-client.cjs
const { createClient } = require("redis");

async function startRegistryHeartbeat({
  name, id, address, port,
  redisUrl, ttlSec = 30, intervalMs = 10_000
}) {
  const client = createClient({ url: redisUrl });
  await client.connect();

  const key = `svc:${name}:${id}`;
  async function beat() {
    await client.setEx(key, ttlSec, JSON.stringify({ address, port }));
  }

  await beat();
  const t = setInterval(beat, intervalMs);

  async function stop() {
    clearInterval(t);
    try { await client.del(key); } catch {}
    try { await client.quit(); } catch {}
    process.exit(0);
  }
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

module.exports = { startRegistryHeartbeat };