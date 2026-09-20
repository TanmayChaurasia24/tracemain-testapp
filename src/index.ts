import express from 'express';
import client from 'prom-client';
import { ordersRouter } from './routes/orders.js';

const app = express();
const port = parseInt(process.env.DEMO_APP_PORT ?? '3002', 10);

// ── Prometheus metrics ──────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpRequestErrors = new client.Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors (5xx)',
  labelNames: ['method', 'route'] as const,
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

// ── Middleware: instrument every request ─────────────────────
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path ?? req.path;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    end(labels);
    httpRequestsTotal.inc(labels);
    if (res.statusCode >= 500) {
      httpRequestErrors.inc({ method: req.method, route });
    }
  });
  next();
});

app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/orders', ordersRouter);

// ── Start ───────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`🚢 Demo app listening on http://localhost:${port}`);
  console.log(`   Metrics: http://localhost:${port}/metrics`);
  console.log(`   Health:  http://localhost:${port}/health`);
  if (process.env.INJECT_LATENCY) {
    console.log(`   ⚠️  Injected latency: ${process.env.INJECT_LATENCY}ms`);
  }
  if (process.env.INJECT_ERROR_RATE) {
    console.log(`   ⚠️  Injected error rate: ${parseFloat(process.env.INJECT_ERROR_RATE) * 100}%`);
  }
});

export { app };
