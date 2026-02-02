import express from 'express';
import cors from 'cors';
import { Chat } from './chat/Chat.js';

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
    const { prompt, system_instruction } = req.body;

    const apiKey = req.headers['gemini-api-key'] as string;
    const youtrackUrl = req.headers['youtrack-url'] as string;
    const youtrackToken = req.headers['youtrack-token'] as string;
    const githubProject = req.headers['github-project'] as string; // Provided as context but maybe not used directly by app currently
    const githubToken = req.headers['github-token'] as string;

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

    // 1. Return 200 OK immediately
    res.status(200).json({ status: 'Processing', chatId });

    // 2. Process in background
    (async () => {
        const chat = Chat.get(chatId);
        await chat.processRequest({
            apiKey,
            prompt,
            system_instruction,
            youtrackUrl,
            youtrackToken,
            githubToken
        });
    })();
});

// GET /chat/:chatId - In-memory log
app.get('/chat/:chatId', (req, res) => {
    const { chatId } = req.params;
    const chat = Chat.get(chatId);
    // Return simple list of interactions
    res.json(chat.interactions);
});

export { app };

// Start server only if run directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(port, () => {
      console.log(`Gemini service listening on port ${port}`);
    });
}
