import { GoogleGenAI } from '@google/genai';

export class Interaction {
  id: string;
  chatId: string | undefined;
  systemInstructions: string;
  promptText: string | undefined;
  response: any;
  previousInteractionId: string | undefined;
  model: string = 'gemini-2.5-flash';

  constructor(
    id: string,
    systemInstructions: string,
    chatId?: string,
    previousInteractionId?: string,
    model?: string
  ) {
    this.id = id;
    this.systemInstructions = systemInstructions;
    this.chatId = chatId;
    this.previousInteractionId = previousInteractionId;
    if (model) {
      this.model = model;
    }
  }

  /**
   * Sends the prompt to the API.
   * @param text The user prompt text.
   * @param apiKey The Gemini API Key.
   * @param githubToken Optional GitHub Token for MCP.
   */
  async prompt(text: string, apiKey: string, githubToken?: string): Promise<any> {
    this.promptText = text;

    // Instantiate GoogleGenAI on the fly with the provided key
    const genAI = new GoogleGenAI({
      apiKey
    });

    const mcpServer = githubToken ? {
      type: 'mcp_server',
      name: 'github',
      url: 'https://api.githubcopilot.com/mcp/',
      headers: {
        Authorization: `Bearer ${githubToken.trim()}`,
      },
    } : undefined;

    const payload: any = {
      model: this.model,
      input: text,
      system_instruction: this.systemInstructions,
    };

    if (mcpServer) {
        payload.tools = [mcpServer];
    }

    if (this.previousInteractionId) {
        payload.previous_interaction_id = this.previousInteractionId;
    }

    // Call the API via any cast since standard SDK might not have .interactions.create
    // BUT we are following the user's previously working signature.
    try {
        // @ts-ignore
        const result = await genAI.interactions.create(payload);
        this.response = result;
        return result;
    } catch (error) {
        throw error;
    }
  }
}
