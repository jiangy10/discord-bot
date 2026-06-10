export const COMMANDS = {
    recordFinance:{
        description: "Record an income or expense. Extract amount, description (preserve Chinese characters exactly), and whether it's income (收入) or expense (消费/支出).",
        parameters: {
            type: "object",
            properties: {
                amount: { type: "number", minimum: 0.01, description: "The amount of money" },
                description: { type: "string", description: "Description of the transaction. MUST preserve all Chinese characters exactly. REMOVE indicator keywords like '记账', 'income', '收入', '入账', 'expense', '消费', '支出', '花费', '开销' from the description." },
                is_income: { type: "boolean", description: "true for income (收入/入账/income), false for expense (消费/支出/花费/开销/expense). Use these keywords in the message to determine the value." }
            },
            required: ["amount", "description", "is_income"]
        }
    }
}as const;

export type CommandName = keyof typeof COMMANDS;