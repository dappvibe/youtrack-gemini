import { describe, it, expect } from 'vitest';
import { Chat } from '../../src/chat/Chat.js';

// Read API key from environment variable
const apiKey = process.env.GEMINI_API_KEY;
const githubToken = process.env.GITHUB_TOKEN;

describe('Chat Real API', () => {
  // Skip test if no API key is provided
  const runTest = apiKey ? it : it.skip;

  runTest('should call real Gemini API', async () => {
    console.log('Testing with real Gemini API...');

    // Create a new Chat instance
    const chat = new Chat('real-api-test-id');
    let callbackCalled = false;

    // Call prompt with real API key
    await chat.prompt(
      'Hello! Please reply with "Pong".',
      apiKey!,
      githubToken,
      'You are a helpful test assistant.', // System instruction
      async (c) => {
        callbackCalled = true;

        // Log the full response for inspection
        // console.log('Full Response:', JSON.stringify(c.response, null, 2));

        // Verify response structure
        expect(c.response).toBeDefined();
        // Adjust these expectations based on the actual GoogleGenAI response structure
        // Usually it's response.candidates[0].content.parts[0].text or similar
        // But since we are using the raw response in Chat.ts:
        // this.response = result;

        // Basic check that we got something back
        expect(c.response).toHaveProperty('candidates');
        expect(Array.isArray(c.response.candidates)).toBe(true);
        expect(c.response.candidates.length).toBeGreaterThan(0);

        const firstCandidate = c.response.candidates[0];
        expect(firstCandidate).toHaveProperty('content');
      }
    );

    expect(callbackCalled).toBe(true);
  }, 60000); // 60s timeout for network call
});
