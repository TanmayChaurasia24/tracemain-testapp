import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import { ordersRouter } from '../src/routes/orders.js';

const app = express();
app.use(express.json());
app.use('/api/orders', ordersRouter);

const request = supertest(app);

describe('GET /api/orders', () => {
  it('returns a list of orders', async () => {
    const res = await request.get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orders');
    expect(res.body).toHaveProperty('count');
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('each order has the expected schema', async () => {
    const res = await request.get('/api/orders');
    for (const order of res.body.orders) {
      expect(order).toHaveProperty('id');
      expect(order).toHaveProperty('customer');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('total');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('createdAt');
      expect(typeof order.total).toBe('number');
      expect(Array.isArray(order.items)).toBe(true);
    }
  });
});

describe('GET /api/orders/:id', () => {
  it('returns a specific order', async () => {
    const res = await request.get('/api/orders/ORD-1001');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('ORD-1001');
    expect(res.body.customer).toBe('alice@example.com');
    expect(res.body.status).toBe('shipped');
  });

  it('returns 404 for unknown order', async () => {
    const res = await request.get('/api/orders/ORD-9999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Order not found');
  });
});

describe('POST /api/orders', () => {
  it('creates a new order', async () => {
    const res = await request.post('/api/orders').send({
      customer: 'dave@example.com',
      items: [{ name: 'Headphones', qty: 1, price: 59.99 }],
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.customer).toBe('dave@example.com');
    expect(res.body.total).toBe(59.99);
    expect(res.body.status).toBe('pending');
  });

  it('rejects order without customer', async () => {
    const res = await request.post('/api/orders').send({
      items: [{ name: 'Mouse', qty: 1, price: 29.99 }],
    });
    expect(res.status).toBe(400);
  });

  it('rejects order without items', async () => {
    const res = await request.post('/api/orders').send({
      customer: 'eve@example.com',
    });
    expect(res.status).toBe(400);
  });

  it('rejects order with empty items array', async () => {
    const res = await request.post('/api/orders').send({
      customer: 'eve@example.com',
      items: [],
    });
    expect(res.status).toBe(400);
  });
});
