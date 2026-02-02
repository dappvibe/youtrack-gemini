import { describe, it, expect, vi } from 'vitest';
import { Client } from '../../src/youtrack/client.js';

vi.mock('youtrack-rest-client', () => {
    return {
        Youtrack: vi.fn().mockImplementation(() => {
            return {
                comments: {
                    create: vi.fn().mockResolvedValue({})
                }
            };
        })
    };
});

describe('Client Callback', () => {
    it('should correctly parse Gemini response and post comment to YouTrack', async () => {
        const adapter = new Client('http://mock', 'token');
        const mockIssueId = 'DEMO-123';

        const geminiInput = {
            "created": "2026-02-02T04:58:52Z",
            "id": "v1_ChdDaS1BYWR2MkdaeXRrZFVQa1pmSWlBYxIXQ2ktQWFkdjJHWnl0a2RVUGtaZklpQWM",
            "model": "gemini-2.5-flash",
            "object": "interaction",
            "outputs": [
                {
                    "signature": "CiRlMjQ4MzBhNy01Y2Q2LTQyZmUtOTk4Yi1lZTUzOWU3MmI5YzM=",
                    "type": "thought"
                },
                {
                    "text": "Pong",
                    "type": "text"
                }
            ],
            "role": "model",
            "status": "completed",
            "updated": "2026-02-02T04:58:52Z",
            "usage": {
                "input_tokens_by_modality": [
                    {
                        "modality": "text",
                        "tokens": 17
                    }
                ],
                "total_cached_tokens": 0,
                "total_input_tokens": 17,
                "total_output_tokens": 1,
                "total_thought_tokens": 0,
                "total_tokens": 18,
                "total_tool_use_tokens": 0
            }
        };

        // Access the mocked client directly to check calls

        const createCommentSpy = adapter.comments.create;

        await adapter.sendGeminiResponse(mockIssueId, geminiInput);

        expect(createCommentSpy).toHaveBeenCalledWith(mockIssueId, {
            text: 'Pong'
        });
    });

    it('should handle responses with no text output', async () => {
        const adapter = new Client('http://mock', 'token');
        const mockIssueId = 'DEMO-123';

        const geminiInputWithoutText = {
            "outputs": [
                {
                    "signature": "some-sig",
                    "type": "thought"
                }
            ]
        };


        const createCommentSpy = adapter.comments.create;

        await adapter.sendGeminiResponse(mockIssueId, geminiInputWithoutText);

        expect(createCommentSpy).not.toHaveBeenCalled();
    });
});
