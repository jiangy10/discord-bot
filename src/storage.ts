import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

const CART_PATH = './src/data/shopping_cart.json';

export async function readCart(): Promise<string[]> {
  try {
    const data = await readFile(CART_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

export async function writeCart(items: string[]): Promise<void> {
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

export async function clearCart(): Promise<void> {
  await writeCart([]);
}
