import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('POST /api/users/update-profile', () => {
  it('should update user profile successfully', async () => {
    const response = await request(app)
      .post('/api/users/update-profile')
      .send({
        id: 1,
        name: 'Alice Updated',
        tags: 'developer,alice@example.com'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name', 'Alice Updated');
    expect(response.body).toHaveProperty('tags', 'developer,alice@example.com');
  });

  it('should return 400 for invalid email in tags', async () => {
    const response = await request(app)
      .post('/api/users/update-profile')
      .send({
        id: 1,
        tags: 'developer,invalid-email@'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid email in tags: invalid-email@');
  });
});
