import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import { app } from '../src/server.js';

const createMock = vi.fn().mockResolvedValue({
  id: 'mock-interaction-id',
  outputs: [{ type: 'text', text: 'Mock Reply' }]
});

// Mock GoogleGenAI to avoid real calls
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    interactions: {
      create: createMock
    }
  }))
}));

// Mock Youtrack client to avoid real calls
vi.mock('youtrack-rest-client', () => {
  return {
    Youtrack: vi.fn().mockImplementation(() => ({
      comments: {
        create: vi.fn().mockResolvedValue({})
      },
      issues: {
        update: vi.fn().mockResolvedValue({})
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
  it('should pass last_interaction_id to Gemini API', async () => {
    const res = await request(app)
      .post('/chat/TEST-ISSUE-2')
      .set('GEMINI-API-KEY', 'test-key')
      .set('YOUTRACK-URL', 'https://example.youtrack.cloud')
      .set('YOUTRACK-TOKEN', 'perm:token')
      .set('GITHUB-PROJECT', 'test-project')
      .set('GITHUB-TOKEN', 'gh-token')
      .send({
        prompt: 'Continue',
        system_instruction: 'sys',
        last_interaction_id: 'prev-id-123'
      });

    expect(res.status).toBe(200);

    // Allow background process to run
    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify Gemini was called with previous_interaction_id
    expect(createMock).toHaveBeenCalled();
    const lastCallArg = createMock.mock.calls[createMock.mock.calls.length - 1][0];
    expect(lastCallArg.previous_interaction_id).toBe('prev-id-123');
  });

  it('should allow optional system_instruction if last_interaction_id is provided', async () => {
    const res = await request(app)
      .post('/chat/TEST-ISSUE-3')
      .set('GEMINI-API-KEY', 'test-key')
      .set('YOUTRACK-URL', 'https://example.youtrack.cloud')
      .set('YOUTRACK-TOKEN', 'perm:token')
      .set('GITHUB-PROJECT', 'test-project')
      .set('GITHUB-TOKEN', 'gh-token')
      .send({
        prompt: 'Continue without sys',
        last_interaction_id: 'prev-id-456'
      });

    expect(res.status).toBe(200);
  });

  it('should return 400 if system_instruction and last_interaction_id are both missing', async () => {
    const res = await request(app)
      .post('/chat/TEST-ISSUE-4')
      .set('GEMINI-API-KEY', 'test-key')
      .set('YOUTRACK-URL', 'https://example.youtrack.cloud')
      .set('YOUTRACK-TOKEN', 'perm:token')
      .set('GITHUB-PROJECT', 'test-project')
      .set('GITHUB-TOKEN', 'gh-token')
      .send({
        prompt: 'New interaction without sys'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('system_instruction is required for new interactions');
  });
});
