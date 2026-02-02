import { GoogleGenAI } from '@google/genai';
import {McpServer} from "../github/mcp.js";

export class Chat {
  id: string; // Chat ID / Issue ID
  apiKey: string;
  githubToken: string;
  systemInstructions?: string;
  response: any;
  model: string;

  constructor(id: string, model: string, apiKey: string, githubToken: string, systemInstructions?: string) {
    this.id = id;
    this.apiKey = apiKey;
    this.githubToken = githubToken;
    this.systemInstructions = systemInstructions;
    this.model = model;
  }

  /**
   * Sends the prompt to the API and executes the callback.
   * @param text The user prompt text.
   * @param previousInteractionId
   * @param callback Callback function to execute after response.
   */
  async prompt(
    text: string,
    previousInteractionId: string | undefined,
    callback: (chat: Chat) => Promise<void>
  ) {
    try {
        console.error(`Processing interaction for chat: ${this.id}`);

        // Instantiate GoogleGenAI on the fly with the provided key
        const genAI = new GoogleGenAI({
          apiKey: this.apiKey
        });

        const mcpServer = new McpServer(this.githubToken);

        const payload: any = {
          model: this.model,
          input: text,
          system_instruction: this.systemInstructions,
          tools: [mcpServer],
          generation_config: {
            thinking_level: 'HIGH',
          },
        };

        if (previousInteractionId) {
            payload.previous_interaction_id = previousInteractionId;
        }

        // Call the API
        // @ts-ignore
        const result = await genAI.interactions.create(payload);
        this.response = result;

        console.error(`Gemini reply for ${this.id}:`, this.response);

        // Execute callback
        await callback(this);

    } catch (error) {
        console.error('Error in background processing:', error);
    }
  }
}
