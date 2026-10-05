import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('POST /api/cart/calculate', () => {
  it('should return 400 if items is missing or not an array', async () => {
    const response = await request(app)
      .post('/api/cart/calculate')
      .send({ discountCode: 'SAVE20' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Valid items array is required.');
  });

  it('should calculate correct totals with no discount', async () => {
    const response = await request(app)
      .post('/api/cart/calculate')
      .send({
        items: [
          { price: 10, quantity: 2 },
          { price: 5, quantity: 4 }
        ]
      });
    
    expect(response.status).toBe(200);
    // Subtotal: (10*2) + (5*4) = 40
    // Tax: 40 * 0.10 = 4
    // Total: 44
    expect(response.body).toEqual({
      subtotal: 40,
      discountAmount: 0,
      tax: 4,
      total: 44
    });
  });

  it('should apply SAVE20 discount correctly', async () => {
    const response = await request(app)
      .post('/api/cart/calculate')
      .send({
        items: [
          { price: 100, quantity: 1 }
        ],
        discountCode: 'SAVE20'
      });
    
    expect(response.status).toBe(200);
    // Subtotal: 100
    // Discount: 20
    // Tax: (100 - 20) * 0.10 = 8
    // Total: 80 + 8 = 88
    expect(response.body).toEqual({
      subtotal: 100,
      discountAmount: 20,
      tax: 8,
      total: 88
    });
  });

  it('should apply HALFOFF discount correctly', async () => {
    const response = await request(app)
      .post('/api/cart/calculate')
      .send({
        items: [
          { price: 200, quantity: 1 }
        ],
        discountCode: 'HALFOFF'
      });
    
    expect(response.status).toBe(200);
    // Subtotal: 200
    // Discount: 100
    // Tax: (200 - 100) * 0.10 = 10
    // Total: 100 + 10 = 110
    expect(response.body).toEqual({
      subtotal: 200,
      discountAmount: 100,
      tax: 10,
      total: 110
    });
  });

  it('should ignore invalid discount code and return error field', async () => {
    const response = await request(app)
      .post('/api/cart/calculate')
      .send({
        items: [
          { price: 100, quantity: 1 }
        ],
        discountCode: 'BADDISCOUNT'
      });
    
    expect(response.status).toBe(200);
    // Subtotal: 100
    // Discount: 0
    // Tax: 10
    // Total: 110
    expect(response.body).toEqual({
      subtotal: 100,
      discountAmount: 0,
      tax: 10,
      total: 110,
      error: 'Invalid discount code'
    });
  });
});
