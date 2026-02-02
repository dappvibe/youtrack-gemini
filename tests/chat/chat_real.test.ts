import { describe, it, expect } from 'vitest';
import { Chat } from '../../src/gemini/Chat.js';
import Youtrack from "../../src/youtrack/client.js";

// Read API key from environment variable
const apiKey = process.env.GEMINI_API_KEY;
const githubToken = process.env.GITHUB_TOKEN;

describe('Chat Real API', () => {
  // Skip test if no API key is provided
  const runTest = apiKey ? it : it.skip;

  runTest('should call real Gemini API', async () => {
    console.log('Testing with real Gemini API...');

    // Create a new Chat instance
    const chat = new Chat(
      'real-api-test-id',
      apiKey!,
      githubToken || 'dummy-token',
      'You are a helpful test assistant.' // System instruction
    );
    let callbackCalled = false;

    // Call prompt with real API key
    await chat.prompt(
      'Hello! Please reply with "Pong".',
      undefined, // No previous interaction ID
      async (c) => {
        callbackCalled = true;

        // Verify response structure
        expect(c.response).toBeDefined();
        expect(c.response).toHaveProperty('outputs');
      }
    );

    expect(callbackCalled).toBe(true);
  }, 60000); // 60s timeout for network call
});
