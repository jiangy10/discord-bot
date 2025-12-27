import { fetchJobPost, JobFilters } from './functions/fetchJob';
import { COMMANDS } from './Commands';

const tools = [
  {
    type: 'function',
    function: {
      name: 'fetchJobPost',
      description: COMMANDS.fetchJobPost.description,
      parameters: COMMANDS.fetchJobPost.parameters,
    }
  }
];

const generalPrompt = (userMessage: string) => [
    {
        role: 'system',
        content: 'You are a helpful dog assistant named Cookie. You can help search for LinkedIn job postings. When users ask about jobs, use the fetchJobPost tool to search for them. Answer in a friendly and engaging manner. End with a funny sound like "Woof!🐶"'
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
          const { hours, keywords, geoId, maxResults } = functionArgs;
          const filters: JobFilters = {};
          
          if (keywords) filters.keywords = keywords;
          if (geoId) filters.geoId = geoId;
          if (maxResults) filters.maxResults = maxResults;
          
          const jobs = await fetchJobPost(hours || 24, filters);
        //   console.log('Jobs:', jobs);
          
          // format job information
          const jobsText = jobs.length > 0 
            ? jobs.map((job, idx) => 
                `${idx + 1}. **${job.title}** at ${job.company}\n   📍 ${job.location}\n   🕒 ${job.postedText}\n   🔗 ${job.url}`
              ).join('\n\n')
            : 'No jobs found matching your criteria.';
          
          // second request: let Llama generate response based on tool results
          const finalResponse = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3.2',
              stream: false,
              messages: [
                {
                    role: 'system',
                    content: `You are a helpful dog assistant named Cookie. You can help search for LinkedIn job postings.
                    Process the given object of job postings results, only keep the jobs that are in Bay Area or remote in US.
                    Format in following template:
                    - Title 🧑‍💻: 
                    - Company 💼:
                    - Location 📍:
                    - Posted Time 🕒:
                    - URL 🔗:
                    seperate with --------------------------------
                    Start with "Here are the job postings", and end with a funny sound like "Woof!🐶"`
                },
                {
                    role: 'user',
                    content: JSON.stringify(jobs)
                }
              ],
            })
          });
          console.log('Final response:', finalResponse);
          
          const finalData = await finalResponse.json() as { message?: { content?: string } };
          return finalData.message?.content || jobsText;
        }
      }
      
      // if no tool related calls, return the response from Llama
      return data.message?.content || 'Woof, something went wrong :<';
    } catch (error) {
      console.error('Llama API error:', error);
      return 'Wooo, not connected to Llama :<';
    }
}