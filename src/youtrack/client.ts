import {Youtrack} from 'youtrack-rest-client';
import GeminiResponse from "../gemini/response.js";

export default class Client extends Youtrack {
  constructor(baseUrl: string, token: string) {
    super({
      baseUrl,
      token
    });
  }

  async sendReply(issueId: any, res: GeminiResponse) {
    const text = res.toString();
    if (text) {
      try {
        await this.comments.create(issueId, {text});
        console.log(`Posted reply to YouTrack issue ${issueId}`);
      } catch (ytError: any) {
        console.error('Error posting to YouTrack:', ytError);
      }
    } else {
      console.error('No text output found in Gemini response. Full response:');
      console.error(JSON.stringify(res));
    }
    return res;
  }

  async updateIssue(id: string, res: GeminiResponse) {
    try {
      await this.issues.update({
        id,
        fields: [{
          name: 'last_interaction_id',
          $type: 'SimpleIssueCustomField',
          value: res.id
        } as any]
      });
    } catch (error) {
      console.error(`Failed to update last_interaction_id for issue ${id}:`, error);
    }
    return res;
  }
}
