import { Client as NotionClient } from '@notionhq/client'
import { File } from './models'

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN })
const NOTES_DB = process.env.NOTION_DB_NOTES!
const FILES_DB = process.env.NOTION_DB_FILES!
const CART_DB = process.env.NOTION_DB_SHOPPING_CART!
const MEALS_DB = process.env.NOTION_DB_MEALS!
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

export async function removeItemFromCart(item: string): Promise<void> {
  if (!CART_DB) throw new Error('NOTION_DB_SHOPPING_CART not configured');
  try {
    if (item === 'all') {
      const response = await notion.databases.query({ database_id: CART_DB });
      await Promise.all(response.results.map((page: any) =>
        notion.pages.update({ page_id: page.id, archived: true })
      ));
      return;
    }
    const response = await notion.databases.query({
      database_id: CART_DB,
      filter: { property: 'Name', title: { equals: item } },
    });
    await Promise.all(response.results.map((page: any) =>
      notion.pages.update({ page_id: page.id, archived: true })
    ));
  } catch (error) {
    console.error('Failed to remove item from cart:', error);
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

export async function removeNoteFromNotes(note: string): Promise<void> {
  try {
    if (note === 'all') {
      const response = await notion.databases.query({ database_id: NOTES_DB });
      await Promise.all(response.results.map((page: any) =>
        notion.pages.update({ page_id: page.id, archived: true })
      ));
      return;
    }
    const response = await notion.databases.query({
      database_id: NOTES_DB,
      filter: { property: 'Name', title: { equals: note } },
    });
    await Promise.all(response.results.map((page: any) =>
      notion.pages.update({ page_id: page.id, archived: true })
    ));
  } catch (error) {
    console.error('Failed to remove note:', error);
    throw error;
  }
}

// ── Files ────────────────────────────────────────────────────────────────────

export async function addFile(fileURL: string, description: string, channelId: string, interactionId: string): Promise<void> {
  try {
    await notion.pages.create({
      parent: { database_id: FILES_DB },
      properties: {
        Name: { title: [{ text: { content: fileURL } }] },
        Description: { rich_text: [{ text: { content: description } }] },
        ChannelId: { rich_text: [{ text: { content: channelId } }] },
        InteractionId: { rich_text: [{ text: { content: interactionId } }] },
      },
    });
  } catch (error) {
    console.error('Failed to add file:', error);
    throw error;
  }
}

export async function getFile(keywords: string): Promise<File[]> {
  try {
    const response = await notion.databases.query({
      database_id: FILES_DB,
      filter: {
        property: 'Description',
        rich_text: { contains: keywords },
      },
    });
    return response.results.map((page: any) => ({
      url: page.properties?.Name?.title?.[0]?.plain_text ?? '',
      description: page.properties?.Description?.rich_text?.[0]?.plain_text ?? '',
      channelId: page.properties?.ChannelId?.rich_text?.[0]?.plain_text ?? '',
      interactionId: page.properties?.InteractionId?.rich_text?.[0]?.plain_text ?? '',
    }));
  } catch (error) {
    console.error('Failed to get file:', error);
    throw error;
  }
}

// ── Meals ────────────────────────────────────────────────────────────────────

export async function addMeal(meal: string): Promise<void> {
  if (!MEALS_DB) throw new Error('NOTION_DB_MEALS not configured');
  try {
    await notion.pages.create({
      parent: { database_id: MEALS_DB },
      properties: {
        Name: { title: [{ text: { content: meal } }] },
      },
    });
  } catch (error) {
    console.error('Failed to add meal:', error);
    throw error;
  }
}

export async function getMeals(): Promise<string[]> {
  if (!MEALS_DB) return [];
  try {
    const response = await notion.databases.query({ database_id: MEALS_DB });
    return response.results.map((page: any) =>
      page.properties?.Name?.title?.[0]?.plain_text ?? ''
    ).filter(Boolean);
  } catch (error) {
    console.error('Failed to get meals:', error);
    return [];
  }
}

export async function deleteMeal(meal: string): Promise<void> {
  if (!MEALS_DB) throw new Error('NOTION_DB_MEALS not configured');
  try {
    if (meal === 'all') {
      const response = await notion.databases.query({ database_id: MEALS_DB });
      await Promise.all(response.results.map((page: any) =>
        notion.pages.update({ page_id: page.id, archived: true })
      ));
      return;
    }
    const response = await notion.databases.query({
      database_id: MEALS_DB,
      filter: { property: 'Name', title: { equals: meal } },
    });
    await Promise.all(response.results.map((page: any) =>
      notion.pages.update({ page_id: page.id, archived: true })
    ));
  } catch (error) {
    console.error('Failed to delete meal:', error);
    throw error;
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
