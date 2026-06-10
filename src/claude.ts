import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-5';
const NOTION_MCP_URL = process.env.NOTION_MCP_URL ?? 'https://mcp.notion.com/mcp';
const NOTION_MCP_TOKEN = process.env.NOTION_MCP_TOKEN;
const MCP_BETA = 'mcp-client-2025-11-20';

const SYSTEM_PROMPT = `You are Cookie, a friendly bilingual (English/中文) daily-life assistant living in a Discord bot.
You can read from and write to the user's Notion workspace through the connected Notion tools.

Guidelines:
- Reply in the same language the user used. If they write in Chinese, answer in Chinese.
- Preserve all Chinese characters exactly as written; never translate or transliterate the user's content.
- When the user asks to record, look up, summarize, or analyze their data (notes, shopping, finances, etc.), use the Notion tools to access the relevant database rather than guessing.
- For general-knowledge questions that are not about the user's own data, just answer directly without calling tools.
- Keep replies concise and friendly.`;

function extractText(content: Anthropic.Beta.Messages.BetaContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.Beta.Messages.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

export async function fetchClaude(userMessage: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return 'Woof, my brain (ANTHROPIC_API_KEY) is not configured yet :<';
  }

  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      mcp_servers: [
        {
          type: 'url',
          url: NOTION_MCP_URL,
          name: 'notion',
          ...(NOTION_MCP_TOKEN ? { authorization_token: NOTION_MCP_TOKEN } : {}),
        },
      ],
      tools: [{ type: 'mcp_toolset', mcp_server_name: 'notion' }],
      betas: [MCP_BETA],
    });

    return extractText(response.content) || 'Woof, I had nothing to say :<';
  } catch (error) {
    console.error('Claude API error:', error);
    return 'Wooo, I could not reach my brain right now :<';
  }
}
