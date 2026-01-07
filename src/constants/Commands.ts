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
        description: "Record an income or expense. Extract amount, description (preserve Chinese characters exactly), and whether it's income (收入) or expense (消费/支出).",
        parameters: {
            type: "object",
            properties: {
                amount: { type: "number", minimum: 0.01, description: "The amount of money" },
                description: { type: "string", description: "Description of the transaction. MUST preserve all Chinese characters exactly as they appear in the user's message." },
                is_income: { type: "boolean", description: "true for income (收入), false for expense (消费/支出)" }
            },
            required: ["amount", "description", "is_income"]
        }
    }
}as const;

export type CommandName = keyof typeof COMMANDS;