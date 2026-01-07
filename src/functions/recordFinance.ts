import { recordFinance } from '../storage';

export async function handleRecordFinance(functionArgs: any): Promise<string> {
  const { amount, description, is_income } = functionArgs;
  await recordFinance(amount, description, is_income);
  return `${is_income.toLowerCase() == "true" ? "income" : "expense"} recorded: ${description} ${amount} `;
}