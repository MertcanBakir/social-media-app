const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { createClient } = require("redis");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Çok fazla istek attınız. Lütfen sonra tekrar deneyin.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

/* ---------- Body & Cookie & CORS ---------- */
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json());

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

app.use(morgan("dev"));

/* ---------- Redis (service registry) ---------- */
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const redis = createClient({ url: REDIS_URL });

redis
  .connect()
  .then(() => console.log("✅ Gateway Redis'e bağlı"))
  .catch((e) => {
    console.error("❌ Redis bağlantı hatası:", e);
    process.exit(1);
  });

/* ---------- Dinamik proxy (service discovery) ---------- */
/**
 * Registry kayıt formatı varsayımı:
 * key:  svc:<serviceName>:<uuid>
 * value: JSON.stringify({ id, name, address, port, ... })
 *   - address: "http://user-service" gibi PROTOKOL + HOST
 *   - port: 6001 gibi
 */
function dynamicProxy(serviceName) {
  const rrKey = `rr:${serviceName}`;

  return createProxyMiddleware({
    changeOrigin: true,
    xfwd: true,
    logLevel: 'debug',
    timeout: 30000,
    proxyTimeout: 30000,

    // 🔽 JSON body’yi upstream’e geri yaz
    onProxyReq: (proxyReq, req) => {
      if (!req.body || !Object.keys(req.body).length) return;
      const bodyData = JSON.stringify(req.body);
      // Content-Type başlığı yoksa ekle
      if (!proxyReq.getHeader('Content-Type')) {
        proxyReq.setHeader('Content-Type', 'application/json');
      }
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    },

    onProxyRes: (proxyRes) => {
      const sc = proxyRes.headers['set-cookie'];
      if (Array.isArray(sc)) {
        proxyRes.headers['set-cookie'] = sc.map((c) =>
          c.replace(/;\s*Secure/gi, '').replace(/SameSite=None/gi, 'SameSite=Lax')
        );
      }
    },

    router: async () => {
      const keys = await redis.keys(`svc:${serviceName}:*`);
      if (!keys.length) {
        const err = new Error(`Service ${serviceName} boş (instance yok)`);
        err.status = 502;
        throw err;
      }
      keys.sort();
      const seq = await redis.incr(rrKey);
      const pickKey = keys[seq % keys.length];

      const raw = await redis.get(pickKey);
      const inst = JSON.parse(raw); // { address|host, port }
      const addr = inst.address || inst.host;
      const base = addr.startsWith('http') ? addr : `http://${addr}`;
      const target = `${base}:${inst.port}`;
      console.debug(`[gateway] ${serviceName} → ${target}`);
      return target;
    },

    onError: (err, _req, res) => {
      res.status(err.status || 502).json({ error: err.message || 'Upstream error' });
    },
  });
}

/* ---------- Healthcheck ---------- */
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "api-gateway" });
});

/* ---------- Servis rotaları (hepsi registry üzerinden) ---------- */
app.use("/user", dynamicProxy("user-service"));
app.use("/tweet", dynamicProxy("tweet-service"));
app.use("/auth", dynamicProxy("auth-service"));
app.use("/follow", dynamicProxy("follow-service"));
app.use("/like", dynamicProxy("like-service"));

/* ---------- 404 fallback ---------- */
app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

/* ---------- Start ---------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚪 API Gateway çalışıyor: http://localhost:${PORT}`);
});