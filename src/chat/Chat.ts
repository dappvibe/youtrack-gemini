import { GoogleGenAI } from '@google/genai';

export class Chat {
  id: string; // Chat ID / Issue ID
  response: any;
  model: string = 'gemini-2.5-flash';

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Sends the prompt to the API and executes the callback.
   * @param text The user prompt text.
   * @param apiKey The Gemini API Key.
   * @param githubToken Optional GitHub Token for MCP.
   * @param systemInstructions Optional system instructions.
   * @param callback Callback function to execute after response.
   */
  async prompt(
    text: string,
    apiKey: string,
    githubToken: string | undefined,
    systemInstructions: string | undefined,
    callback: (chat: Chat) => Promise<void>
  ) {
    try {
        console.error(`Processing interaction for chat: ${this.id}`);

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
          system_instruction: systemInstructions,
        };
    
        if (mcpServer) {
            payload.tools = [mcpServer];
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
