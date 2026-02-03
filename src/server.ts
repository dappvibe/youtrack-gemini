import express from 'express';
import cors from 'cors';
import Youtrack from './youtrack/client.js';
// Start server only if run directly
import {fileURLToPath} from 'url';
import {McpServer} from "./github/mcp.js";
import Interaction from "./gemini/interaction.js";
import {GoogleGenAI} from "@google/genai";
import GeminiResponse from "./gemini/response.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/chat/:chatId', (req, res) => {
  const {chatId: issueId} = req.params;
  const {model, prompt, system_instruction, last_interaction_id} = req.body;

  const apiKey = req.get('GEMINI-API-KEY');
  const youtrackUrl = req.get('YOUTRACK-URL');
  const youtrackToken = req.get('YOUTRACK-TOKEN');
  const githubToken = req.get('GITHUB-TOKEN');

  if (!apiKey) {
    return res.status(503).json({error: 'GEMINI-API-KEY header is required'});
  }
  if (!youtrackUrl || !youtrackToken) {
    return res.status(400).json({error: 'YOUTRACK-URL and YOUTRACK-TOKEN headers are required'});
  }
  if (!githubToken) {
    return res.status(400).json({error: 'GITHUB-PROJECT and GITHUB-TOKEN headers are required'});
  }
  if (!/^[a-zA-Z0-9-]{1,36}$/.test(issueId)) {
    return res.status(400).json({error: 'Chat ID must be alphanumeric with dashes and up to 36 characters.'});
  }
  if (!model) {
    return res.status(400).json({error: 'Model is required'});
  }
  if (!prompt) {
    return res.status(400).json({error: 'Prompt is required'});
  }
  if (!last_interaction_id && !system_instruction) {
    return res.status(400).json({error: 'system_instruction is required for new interactions'});
  }

  const gemini = new GoogleGenAI({ apiKey });
  const tools = [
    new McpServer(githubToken)
  ];

  let interaction = new Interaction({model, input: prompt, tools });
  if (last_interaction_id) {
    interaction.previous_interaction_id = last_interaction_id;
  } else {
    interaction.system_instruction = system_instruction;
  }
  console.log(JSON.stringify(interaction, null, 2));

  const youtrack = new Youtrack(youtrackUrl, youtrackToken);

  // Fork here to not block YouTrack UI
  // @ts-ignore Params type is not exported from genai package
  gemini.interactions.create(interaction)
    .then((res) => new GeminiResponse(res))
    .then((res) => {
      console.log(JSON.stringify(res, null, 2));
      return res;
    })
    .then(async (res) => youtrack.sendReply(issueId, res))
    .then(async (res) => youtrack.updateIssue(issueId, res))
    .catch((e) => console.error(e.toString()));

  res.sendStatus(202); // Accepted
});

export {app};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(port, () => {
    console.log(`Gemini service listening on port ${port}`);
  });
}
