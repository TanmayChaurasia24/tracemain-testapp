import { Router, type Request, type Response } from 'express';

// ── Fake order database ─────────────────────────────────────
interface Order {
  id: string;
  customer: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

const orders: Map<string, Order> = new Map([
  ['ORD-1001', {
    id: 'ORD-1001',
    customer: 'alice@example.com',
    items: [{ name: 'Mechanical Keyboard', qty: 1, price: 149.99 }],
    total: 149.99,
    status: 'shipped',
    createdAt: '2026-08-20T10:30:00Z',
  }],
  ['ORD-1002', {
    id: 'ORD-1002',
    customer: 'bob@example.com',
    items: [
      { name: 'USB-C Hub', qty: 2, price: 39.99 },
      { name: 'Monitor Stand', qty: 1, price: 89.99 },
    ],
    total: 169.97,
    status: 'processing',
    createdAt: '2026-08-22T14:15:00Z',
  }],
  ['ORD-1003', {
    id: 'ORD-1003',
    customer: 'carol@example.com',
    items: [{ name: 'Webcam HD', qty: 1, price: 79.99 }],
    total: 79.99,
    status: 'delivered',
    createdAt: '2026-08-18T09:00:00Z',
  }],
]);

// ── Injectable fault helpers ────────────────────────────────
function getInjectedLatency(): number {
  const raw = process.env.INJECT_LATENCY;
  if (!raw) return 0;
  const ms = parseInt(raw, 10);
  return Number.isNaN(ms) ? 0 : ms;
}

function shouldInjectError(): boolean {
  const raw = process.env.INJECT_ERROR_RATE;
  if (!raw) return false;
  const rate = parseFloat(raw);
  if (Number.isNaN(rate) || rate <= 0) return false;
  return Math.random() < rate;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Router ──────────────────────────────────────────────────
export const ordersRouter = Router();

/**
 * GET /api/orders
 * List all orders.
 */
ordersRouter.get('/', async (_req: Request, res: Response) => {
  const latency = getInjectedLatency();
  if (latency > 0) await sleep(latency);

  if (shouldInjectError()) {
    res.status(500).json({ error: 'Internal server error', code: 'INJECTED_FAULT' });
    return;
  }

  res.json({
    orders: Array.from(orders.values()),
    count: orders.size,
  });
});

/**
 * GET /api/orders/:id
 * Get a single order by ID.
 */
ordersRouter.get('/:id', async (req: Request, res: Response) => {
  const latency = getInjectedLatency();
  if (latency > 0) await sleep(latency);

  if (shouldInjectError()) {
    res.status(500).json({ error: 'Internal server error', code: 'INJECTED_FAULT' });
    return;
  }

  const orderId = req.params.id as string;
  const order = orders.get(orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found', orderId });
    return;
  }

  res.json(order);
});

/**
 * POST /api/orders
 * Create a new order.
 */
ordersRouter.post('/', async (req: Request, res: Response) => {
  const latency = getInjectedLatency();
  if (latency > 0) await sleep(latency);

  if (shouldInjectError()) {
    res.status(500).json({ error: 'Internal server error', code: 'INJECTED_FAULT' });
    return;
  }

  const { customer, items } = req.body as { customer?: string; items?: Order['items'] };
  if (!customer || !items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Missing required fields: customer, items' });
    return;
  }

  const id = `ORD-${1000 + orders.size + 1}`;
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const order: Order = {
    id,
    customer,
    items,
    total: Math.round(total * 100) / 100,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  orders.set(id, order);
  res.status(201).json(order);
});
