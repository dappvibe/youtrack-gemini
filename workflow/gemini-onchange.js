/**
 * Gemini Integration: On-change rule
 * listes for comments and triggers Gemini API interactions.
 */

const entities = require('@jetbrains/youtrack-scripting-api/entities');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');
const http = require('@jetbrains/youtrack-scripting-api/http');
const config = require('./config');
const Gemini = require('./gemini');

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

        const gemini = new Gemini(botUser);
        try {
          gemini.prompt(issue, comment.text);
          workflow.message('Thinking');
        } catch (e) {
          workflow.message(`Error: ${e.message}`);
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
