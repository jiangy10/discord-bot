export const COMMANDS = {
    fetchJobPost: {
        description: "Search recent LinkedIn job postings.",
        parameters: {
        type: "object",
        properties: {
            hours: { type: "number", minimum: 1, maximum: 168 },
            keywords: { type: "string" },
            maxResults: { type: "number", minimum: 1, maximum: 20 }
        },
        required: ["hours"]
        }
    }
}as const;

export type CommandName = keyof typeof COMMANDS;