import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

const CART_PATH = './src/data/shopping_cart.json';
const NOTES_PATH = './src/data/notes.json';

export async function readCart(): Promise<string[]> {
  try {
    const data = await readFile(CART_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeCart(items: string[]): Promise<void> {
  try {
    // Ensure directory exists
    await mkdir(dirname(CART_PATH), { recursive: true });
    await writeFile(CART_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write cart:', error);
    throw error;
  }
}

export async function addItemToCart(item: string): Promise<void> {
  const cart = await readCart();
  cart.push(item);
  await writeCart(cart);
}

export async function removeItemFromCart(item: string): Promise<void> {
  const cart = await readCart();
  const index = cart.indexOf(item);
  if (index !== -1) {
    cart.splice(index, 1);
    await writeCart(cart);
  }
}

export async function clearCart(): Promise<void> {
  await writeCart([]);
}

async function writeNote(items: string[]): Promise<void> {
  try {
    await mkdir(dirname(NOTES_PATH), { recursive: true });
    await writeFile(NOTES_PATH, JSON.stringify(items, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write notes:', error);
    throw error;
  }
}

export async function addNote(note: string): Promise<void> {
  const notes = await readNotes();
  notes.push(note);
  await writeNote(notes);
}

export async function readNotes(): Promise<string[]> {
  try {
    const data = await readFile(NOTES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}