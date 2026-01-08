import { recordFinance } from '../storage';

export async function handleRecordFinance(functionArgs: any): Promise<string> {
  const { amount, description, is_income } = functionArgs;
  
  // Handle both boolean and string types
  const isIncome = typeof is_income === 'boolean' ? is_income : is_income === 'true';
  
  await recordFinance(amount, description, isIncome);
  return `${isIncome ? "income" : "expense"} recorded: ${description} ${amount}`;
}