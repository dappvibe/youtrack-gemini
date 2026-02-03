const http = require('@jetbrains/youtrack-scripting-api/http');
const config = require('./config');

module.exports = class Gemini
{
  url = 'https://gemini.dappvibe.online';
  youtrackUrl = 'https://dappvibe.youtrack.cloud';

  /**
   * @param user User that has props to connect to Gemini API
   */
  constructor(user) {
    this.user = user;

    this.apiKey = user.attributes.apikey;
    this.githubToken = user.attributes.githubToken;
    this.model = user.attributes.model;
    this.permToken = user.attributes.permtoken;

    if (!this.apiKey || !this.permToken) {
      throw new Error(`Missing API Key or Perm Token for user ${user.login}`);
    }
  }

  prompt(issue, message) {
    const connection = new http.Connection(this.url);
    connection.addHeader('Content-Type', 'application/json');
    connection.addHeader('GEMINI-API-KEY', this.apiKey);
    connection.addHeader('YOUTRACK-TOKEN', this.permToken);
    connection.addHeader('YOUTRACK-URL', this.youtrackUrl);
    connection.addHeader('GITHUB-TOKEN', this.githubToken);

    const payload = {
      model: this.model,
      prompt: message
    };

    /*const mentionRegex = new RegExp('@' + botConfig.username, 'gi');
    const cleanMessage = comment.text.replace(mentionRegex, '').trim();*/

    let interactionId = issue.fields['last_interaction_id'];

    if (interactionId) {
      payload.last_interaction_id = interactionId;
    }
    else {
      message += ``;

      const botConfig = config.BOTS.find(b => b.username === this.user.login);
      if (!botConfig) throw new Error(`Bot configuration not found for user ${this.user.login}`);

      let system = botConfig.systemPrompt;
      system += `
ISSUE ${issue.id} CONTEXT:\n
Title: ${issue.summary}\n
Description: ${issue.description}\n
MESSAGES LOG:`;
      issue.comments.forEach(c => {
        if (c.id === message.id) return; // skip current trigger comment
        system += `${c.author.fullName} (${new Date(c.created).toISOString()}): ${c.text}\n`;
      });

      payload.system_instruction = system;
    }

    const response = connection.postSync('/chat/' + issue.id, null, JSON.stringify(payload));

    if (!response.isSuccess) {
      let errorText = response.response;
      try {
        const errorJson = JSON.parse(response.response);
        if (errorJson.error && errorJson.error.message) {
          errorText = errorJson.error.message;
        }
      } catch (e) {
        // failed to parse JSON, accept text
      }
      throw new Error(`Gemini API Error (${response.code}): ${errorText}`);
    }
  }
}
