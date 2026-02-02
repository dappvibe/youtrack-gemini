import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import { app } from '../src/server.js';

// Mock the client api to avoid real calls
vi.mock('../src/api.js', () => ({
  client: {
    interactions: {
      create: vi.fn().mockResolvedValue({
        id: 'mock-interaction-id',
        response: { candidates: [{ content: { parts: [{ text: 'Mock Reply' }] } }] }
      })
    }
  }
}));

// Mock Youtrack client to avoid real calls
vi.mock('youtrack-rest-client', () => {
  return {
    Youtrack: vi.fn().mockImplementation(() => ({
      comments: {
        create: vi.fn().mockResolvedValue({})
      }
    }))
  };
});

describe('POST /chat/:chatId', () => {
  it('should return 200 immediately and process in background', async () => {
    const res = await request(app)
      .post('/chat/TEST-ISSUE-1')
      .set('GEMINI-API-KEY', 'test-key')
      .set('YOUTRACK-URL', 'https://example.youtrack.cloud')
      .set('YOUTRACK-TOKEN', 'perm:token')
      .set('GITHUB-PROJECT', 'test-project')
      .set('GITHUB-TOKEN', 'gh-token')
      .send({ prompt: 'Hello', system_instruction: 'sys' });

    // Expect immediate 200 OK
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'Processing', chatId: 'TEST-ISSUE-1' });

    // Wait a bit for async background process (in real unit test we might want to wait for promises,
    // but here we just check the immediate response as requested, and maybe check side effects if we could hook into them)
    // Since we mocked dependencies, we are verifying the server structure handles the request correctly.
  });

  it('should return 400 if headers are missing', async () => {
    const res = await request(app)
      .post('/chat/TEST-ISSUE-1')
      .set('GEMINI-API-KEY', 'test-key')
      // Missing YOUTRACK headers
      .send({ prompt: 'Hello' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('headers are required');
  });
});
