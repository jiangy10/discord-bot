import { Client as NotionClient } from '@notionhq/client'

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN })
const NOTES_DB = process.env.NOTION_DB_NOTES!
const CART_DB = process.env.NOTION_DB_SHOPPING_CART!
const FINANCE_DB = process.env.NOTION_DB_FINANCE!

// ── Shopping Cart ────────────────────────────────────────────────────────────

export async function readCart(): Promise<string[]> {
  if (!CART_DB) return [];
  try {
    const response = await notion.databases.query({ database_id: CART_DB });
    return response.results.map((page: any) =>
      page.properties?.Name?.title?.[0]?.plain_text ?? ''
    ).filter(Boolean);
  } catch (error) {
    console.error('Failed to read cart:', error);
    return [];
  }
}

export async function addItemToCart(item: string): Promise<void> {
  if (!CART_DB) throw new Error('NOTION_DB_SHOPPING_CART not configured');
  try {
    await notion.pages.create({
      parent: { database_id: CART_DB },
      properties: {
        Name: { title: [{ text: { content: item } }] },
      },
    });
  } catch (error) {
    console.error('Failed to add item to cart:', error);
    throw error;
  }
}

// ── Notes ────────────────────────────────────────────────────────────────────

export async function addNote(note: string): Promise<void> {
  try {
    await notion.pages.create({
      parent: { database_id: NOTES_DB },
      properties: {
        Name: { title: [{ text: { content: note } }] },
      },
    });
  } catch (error) {
    console.error('Failed to add note:', error);
    throw error;
  }
}

export async function readNotes(): Promise<string[]> {
  try {
    const response = await notion.databases.query({ database_id: NOTES_DB });
    return response.results.map((page: any) => {
      const title = page.properties?.Name?.title;
      return title?.[0]?.plain_text ?? '';
    }).filter(Boolean);
  } catch (error) {
    console.error('Failed to read notes:', error);
    return [];
  }
}

// ── Finance ──────────────────────────────────────────────────────────────────

export async function recordFinance(amount: number, description: string, is_income: boolean): Promise<void> {
  if (!FINANCE_DB) throw new Error('NOTION_DB_FINANCE not configured');
  try {
    await notion.pages.create({
      parent: { database_id: FINANCE_DB },
      properties: {
        Name: { title: [{ text: { content: description } }] },
        Amount: { number: amount },
        IsIncome: { checkbox: is_income },
        Date: { date: { start: new Date().toISOString() } },
      },
    });
  } catch (error) {
    console.error('Failed to record finance:', error);
    throw error;
  }
}
