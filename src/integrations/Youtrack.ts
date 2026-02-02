import { Youtrack } from 'youtrack-rest-client';

export class YoutrackAdapter {
    private client: Youtrack;

    constructor(baseUrl: string, token: string) {
        this.client = new Youtrack({
            baseUrl,
            token
        });
    }

    async sendGeminiResponse(issueId: string, response: any) {
        let replyText = '';
        for(const output of response.outputs) {
            if(output.type === 'text' && output.text) {
                replyText = output.text;
            }
        }

        if (replyText) {
            try {
                await this.client.comments.create(issueId, {
                    text: replyText
                });
                console.error(`Posted reply to YouTrack issue ${issueId}`);
            } catch (ytError: any) {
                console.error('Error posting to YouTrack:', ytError);
            }
        } else {
          console.log('No text output found in Gemini response. Full response:');
          console.log(JSON.stringify(response));
        }
    }
}
