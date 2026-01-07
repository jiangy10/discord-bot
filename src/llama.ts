import { handleFetchJobPost } from './functions/fetchJob';
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
        content: `You are a daily task assistant. 
        When users ask about jobs, use the fetchJobPost tool to search for them. 
        When users ask about recording income or expense, use the recordFinance tool to record them.`
    },
    {
        role: 'user',
        content: userMessage
    }
]

export async function fetchLlama(userMessage: string): Promise<string> {
    try {
      const messages = generalPrompt(userMessage);
      
      // first request: send messages and tool definitions to Llama
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
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
      
      console.log('Llama response:', JSON.stringify(data, null, 2));
      
      // check if there are tool related calls
      if (data.message?.tool_calls && data.message.tool_calls.length > 0) {
        const toolCall = data.message.tool_calls[0];
        const functionName = toolCall.function.name;
        const functionArgs = typeof toolCall.function.arguments === 'string' 
          ? JSON.parse(toolCall.function.arguments) 
          : toolCall.function.arguments;
        
        console.log(`Tool called: ${functionName}`, functionArgs);
        
        // execute tool call
        if (functionName === 'fetchJobPost') {
          return await handleFetchJobPost(functionArgs);
        }
      }
      
      // if no tool related calls, return the response from Llama
      return data.message?.content || 'Woof, something went wrong :<';
    } catch (error) {
      console.error('Llama API error:', error);
      return 'Wooo, not connected to Llama :<';
    }
}