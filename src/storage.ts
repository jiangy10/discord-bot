import { createClient } from '@supabase/supabase-js'
import { File } from './models'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey: string = process.env.SUPABASE_KEY!
if (!supabaseKey) {
  throw new Error('Missing SUPABASE_KEY');
}

// Init database client
const supabase = createClient(supabaseUrl, supabaseKey)

export async function readCart(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('ShoppingCart').select('item');
    if (error) {
      console.error('Failed to read cart from Supabase:', error);
      return [];
    }
    return data.map((entry: { item: string }) => entry.item);
  } catch (error) {
    console.error('Unexpected error while reading cart:', error);
    return [];
  }
}

export async function addItemToCart(item: string): Promise<void> {
  try {
    await supabase.from('ShoppingCart').insert({ item: item });
  } catch (error) {
    console.error('Failed to add item to cart:', error);
    throw error;
  }
}

export async function removeItemFromCart(item: string): Promise<void> {
  if (item === 'all') {
    await supabase.from('ShoppingCart').delete().neq('id', 0);
    return;
  }
  try {
    await supabase.from('ShoppingCart').delete().eq('item', item);
  } catch (error) {
    console.error('Failed to remove item from cart:', error);
    throw error;
  }
}

export async function addNote(note: string): Promise<void> {
  try {
    await supabase.from('Notes').insert({ note: note });
  } catch (error) {
    console.error('Failed to add note:', error);
    throw error;
  }
}

export async function readNotes(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from('Notes').select('note');
    if (error) {
      console.error('Failed to read notes:', error);
      return [];
    }
    return data.map((entry: { note: string }) => entry.note);
  } catch (error) {
    console.error('Failed to read notes:', error);
    throw error;
  }
}

export async function removeNoteFromNotes(note: string): Promise<void> {
  if (note === 'all') {
    await supabase.from('Notes').delete().neq('id', 0);
    return;
  }
  try {
    await supabase.from('Notes').delete().eq('note', note);
  } catch (error) {
    console.error('Failed to remove note from notes:', error);
    throw error;
  }
}

export async function addFile(fileURL: string, description: string, channelId: string, interactionId: string): Promise<void> {
  try {
    await supabase.from('Files').insert({ url: fileURL, description: description, channelId: channelId, interactionId: interactionId });
  } catch (error) {
    console.error('Failed to add file:', error);
    throw error;
  }
}

export async function getFile(keywords: string): Promise<File[]> {
  try {
    const { data, error } = await supabase.from('Files').select('*').ilike('description', `%${keywords}%`);
    if (error) {
      console.error('Failed to get file:', error);
      return [];
    }
    return data;
  } catch (error) {
    console.error('Failed to get file:', error);
    throw error;
  }
}