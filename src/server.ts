import express from 'express';
import cors from 'cors';
import { Chat } from './api/Chat.js';
import { YoutrackAdapter } from './integrations/Youtrack.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

/**
 * POST /chat/:chatId
 * Requires GEMINI-API-KEY header.
 * Requires YOUTRACK-URL and YOUTRACK-TOKEN headers.
 * Requires GITHUB-PROJECT and GITHUB-TOKEN headers.
 */
app.post('/chat/:chatId', (req, res) => {
    const { chatId } = req.params;
    const { prompt, system_instruction, last_interaction_id } = req.body;

    const apiKey = req.get('GEMINI-API-KEY');
    const youtrackUrl = req.get('YOUTRACK-URL');
    const youtrackToken = req.get('YOUTRACK-TOKEN');
    const githubProject = req.get('GITHUB-PROJECT'); // Provided as context but maybe not used directly by app currently
    const githubToken = req.get('GITHUB-TOKEN');

    // Requirement: keys are required
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI-API-KEY header is required' });
    }
    if (!youtrackUrl || !youtrackToken) {
        return res.status(400).json({ error: 'YOUTRACK-URL and YOUTRACK-TOKEN headers are required' });
    }
    if (!githubProject || !githubToken) {
       return res.status(400).json({ error: 'GITHUB-PROJECT and GITHUB-TOKEN headers are required' });
    }

    // Validation
    const idRegex = /^[a-zA-Z0-9-]{1,36}$/;
    if (!idRegex.test(chatId)) {
      return res.status(400).json({ error: 'Chat ID must be alphanumeric with dashes and up to 36 characters.' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!last_interaction_id && !system_instruction) {
      return res.status(400).json({ error: 'system_instruction is required for new interactions' });
    }

    // 1. Return 200 OK immediately
    res.status(200).json({ status: 'Processing', chatId });

    // 2. Process in background
    (async () => {
        const youtrack = new YoutrackAdapter(youtrackUrl, youtrackToken);
        const chat = new Chat(chatId);

        await chat.prompt(
            prompt,
            apiKey,
            githubToken,
            system_instruction,
            last_interaction_id,
            async (chat) => {
                await youtrack.sendGeminiResponse(chat.id, chat.response);

                if (chat.response && chat.response.id) {
                     await youtrack.updateInteractionId(chat.id, chat.response.id);
                }
            }
        );
    })();
});

export { app };

// Start server only if run directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(port, () => {
      console.log(`Gemini service listening on port ${port}`);
    });
}
