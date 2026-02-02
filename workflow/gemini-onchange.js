/**
 * Gemini Integration: On-change rule
 * listes for comments and triggers Gemini API interactions.
 */

const entities = require('@jetbrains/youtrack-scripting-api/entities');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');
const http = require('@jetbrains/youtrack-scripting-api/http');
const api = require('./api');
const config = require('./config');

exports.rule = entities.Issue.onChange({
  title: 'Gemini AI Interaction',
  guard: (ctx) => {
    return ctx.issue.comments.added.isNotEmpty();
  },
  action: (ctx) => {
    const issue = ctx.issue;
    const addedComments = issue.comments.added;

    config.BOTS.forEach(botConfig => {
      addedComments.forEach(comment => {
        // 1. Check if bot is mentioned
        if (comment.text.indexOf('@' + botConfig.username) === -1) {
          return;
        }

        // Prevent bot from replying to itself
        if (comment.author.login === botConfig.username) {
            return;
        }

        // 2. Retrieve Bot User entity from requirements
        // Note: requirements key must match config.username.
        // Since we hardcoded 'gemini' in requirements, we assume config uses 'gemini'.
        // To be safe, we check if the user exists in ctx.
        const botUser = ctx[botConfig.username];
        if (!botUser) {
          console.error(`Bot user '${botConfig.username}' not found in requirements.`);
          return;
        }

        // 3. Fetch user properties
        const attributes = botUser.attributes || {};
        const apiKey = attributes.apikey;
        const model = attributes.model;
        const permToken = attributes.permtoken;
        const githubToken = attributes.githubToken;

        if (!apiKey || !permToken) {
           console.error(`Missing API Key or Perm Token for user ${botConfig.username}`);
           // Optional: reply with error?
           return;
        }

        // 4. Instantiate API
        const geminiApi = new api.Api(apiKey, githubToken);

        // 5. Check last_interaction_id
        let interactionId = issue.fields[ctx.interactionIdField.name];

        // 6. Prompt Construction
        // Remove mention from text
        const mentionRegex = new RegExp('@' + botConfig.username, 'gi');
        const cleanMessage = comment.text.replace(mentionRegex, '').trim();

        let payload = {
          model: model,
          input: []
        };

        try {
            if (!interactionId) {
                // NEW CONVERSATION
                const systemPrompt = botConfig.systemPrompt;

                // Construct message log
                let messagesLog = "";
                issue.comments.forEach(c => {
                    if (c.id === comment.id) return; // skip current trigger comment
                    messagesLog += `${c.author.fullName} (${new Date(c.created).toISOString()}): ${c.text}\n`;
                });

                const fullSystemPrompt = `${systemPrompt}\n\nISSUE CONTEXT:\nTitle: ${issue.summary}\nDescription: ${issue.description}\n\nMESSAGES LOG:\n${messagesLog}`;

                // Gemini API payload structure for new chat
                // The 'api.js' wraps /v1beta/interactions
                // We assume it supports 'system_instruction' or we treat it as context.
                // Based on standard implementation, we can send system instruction.

                payload = {
                    model: model,
                    input: cleanMessage,
                    system_instruction: fullSystemPrompt
                };

            } else {
                // EXISTING CONVERSATION
                payload = {
                    model: model,
                    input: cleanMessage,
                    previous_interaction_id: interactionId
                };
            }

            // 7. API Call
            const response = geminiApi.create(payload);

            // 8. Update State
            if (response.interaction_id) {
                issue.fields[ctx.interactionIdField.name] = response.interaction_id;
            }

            // 9. Post Response
            let replyText = "";
            if (response.outputs && response.outputs.length > 0) {
                const out = response.outputs[1];
                replyText = out.text;
            } else {
                 replyText = "(No response content)";
            }

            postCommentAsUser(issue, replyText, permToken);

        } catch (err) {
            console.error(err);
            workflow.message(`Gemini Error: ${err.message}`);
        }

      });
    });
  },
  requirements: {
    gemini: {
       type: entities.User,
       login: 'gemini'
    },
    interactionIdField: {
        type: entities.Field.stringType,
        name: 'last_interaction_id'
    }
  }
});

/**
 * Posts a comment to the issue acting as the bot user via YouTrack REST API
 * @param {object} issue - The issue entity
 * @param {string} text - The comment text
 * @param {string} permToken - The bot's permanent token
 */
function postCommentAsUser(issue, text, permToken) {
    if (!issue.url) {
        console.warn("Cannot deduce base URL from issue.url (empty). Falling back to standard comment.");
         issue.addComment(text);
         return;
    }

    // issue.url format: https://<base>/issue/<id>
    // We want https://<base>
    const urlParts = issue.url.split('/issue/');
    if (urlParts.length < 2) {
         console.warn("Cannot parse base URL from " + issue.url);
         issue.addComment(text);
         return;
    }
    const baseUrl = urlParts[0];

    // API Endpoint: /api/issues/{id}/comments
    // Note: Use issue.id (e.g. "DEMO-12") or issue.key?
    // issue.id in JS API is the readable ID (Project-Number).
    const apiUrl = '/api/issues/' + issue.id + '/comments';

    const connection = new http.Connection(baseUrl);
    connection.addHeader('Authorization', 'Bearer ' + permToken);
    connection.addHeader('Content-Type', 'application/json');
    connection.addHeader('Accept', 'application/json');

    const payload = {
        text: text
    };

    try {
        const response = connection.postSync(apiUrl, null, JSON.stringify(payload));
        if (!response.isSuccess) {
            console.error("Failed to post comment as bot: " + response.status + " " + response.response);
            // Fallback
            issue.addComment(`[Bot Response Failed to Post properly]\n${text}`);
        }
    } catch (e) {
        console.error("Exception posting comment as bot: " + e);
        issue.addComment(text);
    }
}
