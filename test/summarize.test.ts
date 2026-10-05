import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

// Mock the @google/genai module
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: vi.fn().mockResolvedValue({
            text: JSON.stringify({
              summary: 'This is a mocked summary.',
              sentiment: 'Neutral'
            })
          })
        }
      };
    })
  };
});

describe('POST /api/summarize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if text is missing', async () => {
    const response = await request(app)
      .post('/api/summarize')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 400 if text is not a string', async () => {
    const response = await request(app)
      .post('/api/summarize')
      .send({ text: 123 });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return a summary and sentiment for valid input', async () => {
    const response = await request(app)
      .post('/api/summarize')
      .send({ text: 'This is a valid piece of text.' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('summary', 'This is a mocked summary.');
    expect(response.body).toHaveProperty('sentiment', 'Neutral');
  });
});
