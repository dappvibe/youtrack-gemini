import { client } from '../api.js';
import { Youtrack } from 'youtrack-rest-client';
import { Interaction } from './Interaction.js';

interface RequestOptions {
    apiKey: string;
    prompt: string;
    system_instruction?: string;
    youtrackUrl: string;
    youtrackToken: string;
    githubToken?: string;
}

export class Chat {
  id: string; // Chat ID / Issue ID
  constructor(id: string) {
    this.id = id;
  }

  /**
   * Process a new request: call Gemini, store interaction, post to YouTrack
   */
  async processRequest(options: RequestOptions) {
      const { apiKey, prompt, system_instruction, youtrackUrl, youtrackToken, githubToken } = options;

      try {
          console.error(`Processing interaction for chat: ${this.id}`);

          // Create new interaction
          const interaction = await client.interactions.create({
              apiKey,
              githubToken,
              input: prompt,
              system_instructions: system_instruction,
              chat_id: this.id,
              previous_interaction_id: undefined,
              model: 'gemini-2.5-flash'
          });

          // Log to stderr
          console.error(`Gemini reply for ${this.id}:`, interaction.response);

          // Post reply to YouTrack
          const yt = new Youtrack({
              baseUrl: youtrackUrl,
              token: youtrackToken
          });

          let replyText = '';
          if (interaction.response && interaction.response.candidates && interaction.response.candidates[0] && interaction.response.candidates[0].content && interaction.response.candidates[0].content.parts) {
                replyText = interaction.response.candidates[0].content.parts.map((p: any) => p.text).join('');
          } else {
                replyText = JSON.stringify(interaction.response);
          }

          if (replyText) {
              try {
                  await yt.comments.create(this.id, {
                      text: replyText
                  });
                  console.error(`Posted reply to YouTrack issue ${this.id}`);
              } catch (ytError: any) {
                  console.error('Error posting to YouTrack:', ytError);
              }
          }

      } catch (error: any) {
          console.error('Error in background processing:', error);
      }
  }
}
