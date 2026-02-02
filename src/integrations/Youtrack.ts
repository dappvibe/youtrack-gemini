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
        if (response && response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            replyText = response.candidates[0].content.parts.map((p: any) => p.text).join('');
        } else {
            replyText = JSON.stringify(response);
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
        }
    }
}
