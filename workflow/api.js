/**
 * @module gemini/api
 * @description Gemini API interactions client for YouTrack Workflows
 */

const http = require('@jetbrains/youtrack-scripting-api/http');

/**
 * @typedef {Object} Message
 * @property {string} role - The role of the message author (e.g., 'user', 'model')
 * @property {string|Object[]} content - The content of the message
 */

/**
 * @typedef {Object} InteractionInput
 * @property {string} model - The model to use (e.g., 'gemini-3-flash-preview')
 * @property {string|Message[]} input - The input prompt or conversation history
 * @property {Object} [generation_config] - Optional generation configuration
 * @property {string[]} [response_modalities] - Optional response modalities
 * @property {Object[]} [tools] - Optional tools configuration
 */

/**
 * @typedef {Object} InteractionOutput
 * @property {Object[]} outputs - The model outputs
 */

/**
 * Client for the Gemini Interactions API.
 * Encapsulates fetch logic and provides type hints.
 */
class Api {
  /**
   * @param {string} apiKey - The Google Gemini API key
   * @param {string} githubToken - The GitHub Token for MCP
   */
  constructor(apiKey, githubToken) {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    if (!githubToken) {
      throw new Error("GitHub Token is required for MCP");
    }
    this.apiKey = apiKey;
    this.githubToken = githubToken;
    this.baseUrl = "https://generativelanguage.googleapis.com";
    this.endpoint = "/v1beta/interactions";
  }

  /**
   * Creates a new interaction with the Gemini model.
   *
   * @param {InteractionInput} params - The interaction parameters
   * @returns {InteractionOutput} The API response
   * @throws {Error} If the request fails
   */
  create(params) {
    const connection = new http.Connection(this.baseUrl, null, 20000);
    connection.addHeader('Content-Type', 'application/json');
    connection.addHeader('x-goog-api-key', this.apiKey);

    // Construct the payload, adding the GitHub MCP tool
    const payload = { ...params };

    // Add GitHub MCP tool if token is present
    const mcpServer = {
      type: 'mcp_server',
      name: 'github',
      url: 'https://api.githubcopilot.com/mcp/',
      headers: {
        Authorization: `Bearer ${this.githubToken.trim()}`,
      },
    };

    if (!payload.tools) {
      payload.tools = [];
    }
    payload.tools.push(mcpServer);

    const response = connection.postSync(this.endpoint, null, JSON.stringify(payload));

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

    try {
      return JSON.parse(response.response);
    } catch (e) {
      throw new Error("Failed to parse successful response from Gemini API");
    }
  }
}

exports.Api = Api;
