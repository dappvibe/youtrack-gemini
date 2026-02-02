export class McpServer {
  type = 'mcp_server' as const;
  name = 'github' as const;
  url = 'https://api.githubcopilot.com/mcp/' as const;
  headers: { Authorization: string };

  constructor(githubToken: string) {
    this.headers = {
      Authorization: `Bearer ${githubToken.trim()}`,
    };
  }
}
