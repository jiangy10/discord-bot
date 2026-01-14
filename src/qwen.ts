import { handleFetchJobPost } from './functions/fetchJob';
import { handleRecordFinance } from './functions/recordFinance';
import { COMMANDS } from './constants/Commands';

const tools = [
  {
    type: 'function',
    function: {
      name: 'fetchJobPost',
      description: COMMANDS.fetchJobPost.description,
      parameters: COMMANDS.fetchJobPost.parameters,
    }
  },
  {
    type: 'function',
    function: {
      name: 'recordFinance',
      description: COMMANDS.recordFinance.description,
      parameters: COMMANDS.recordFinance.parameters,
    }
  }
];

const generalPrompt = (userMessage: string) => [
    {
        role: 'system',
        content: `You are a daily task assistant that supports both English and Chinese. 
        When users ask about jobs, use the fetchJobPost tool to search for them. 
        When users ask about recording income or expense (记账/消费/收入), use the recordFinance tool to record them.
        
        IMPORTANT: When extracting parameters from user messages:
        - Preserve ALL Chinese characters EXACTLY as they appear in the user's message
        - Do NOT translate, transliterate, or modify Chinese text
        - Keep the original text encoding intact
        - For example, if user says "Mingkee Deli喝粥", the description should be exactly "Mingkee Deli喝粥"
        
        For recordFinance tool:
        - Extract the amount (金额/数字)
        - Extract the description (描述/说明), preserving ALL original characters
        - Determine if it's income (收入) or expense (消费/支出):
          * If message contains keywords: "income", "收入", "入账" → set is_income to true
          * If message contains keywords: "expense", "消费", "支出", "花费", "开销" → set is_income to false
          * Use these keywords to help determine is_income, then REMOVE them from the description
          * The description should NOT contain these indicator keywords (记账/income/收入/入账/expense/消费/支出/花费/开销)
        
        Example:
        - Input: "记账 Amazon-Rio Grande棋 消费39.55"
        - description should be: "Amazon-Rio Grande棋" (removed "记账" and "消费")
        - is_income should be: false (because "消费" indicates expense)`
    },
    {
        role: 'user',
        content: userMessage
    }
]

export async function fetchQwen(userMessage: string): Promise<string> {
    try {
      const messages = generalPrompt(userMessage);
      
      // first request: send messages and tool definitions to Qwen
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen2.5',
          stream: false,
          messages: messages,
          tools: tools,
        })
      });
      
      const data = await response.json() as { 
        message?: { 
          content?: string;
          tool_calls?: Array<{
            function: {
              name: string;
              arguments: any;
            }
          }>;
        } 
      };
      
      // check if there are tool related calls
      if (data.message?.tool_calls && data.message.tool_calls.length > 0) {
        const toolCall = data.message.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        
        // execute tool call
        switch (functionName) {
          case 'fetchJobPost':
            return await handleFetchJobPost(functionArgs);
          case 'recordFinance':
            return await handleRecordFinance(functionArgs);
          default:
            return 'Woof, something went wrong :<';
        }
      }
      
      // if no tool related calls, return the response from Qwen
      return data.message?.content || 'Woof, something went wrong :<';
    } catch (error) {
      console.error('Qwen API error:', error);
      return 'Wooo, not connected to Qwen :<';
    }
}

