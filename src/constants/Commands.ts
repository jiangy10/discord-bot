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
    },
    recordFinance:{
        description: "Record a income or expense.",
        parameters: {
            type: "object",
            properties: {
                amount: { type: "number", minimum: 0.01 },
                description: { type: "string" },
                is_income: { type: "boolean" },
                date: { type: "string", format: "date-time" },
            },
            required: ["amount", "description", "is_income", "date"]
        }
    }
}as const;

export type CommandName = keyof typeof COMMANDS;