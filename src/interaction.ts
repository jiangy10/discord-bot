import { ChatInputCommandInteraction, Client, Attachment} from 'discord.js';
import { addItemToCart, readCart, removeItemFromCart, readNotes, addNote, removeNoteFromNotes, addFile } from './storage';

export async function handleSlashCommand(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;

  try {
    switch (commandName) {
        case 'shop': // add item to card
            const item = interaction.options.getString('item', true);
            await addItemToCart(item);
            await interaction.reply(`Added "${item}" to the shopping list 🛒`);
            break;
        case 'list-cart': // list all items in the card
            const cart = await readCart();
            if (cart.length === 0) {
                await interaction.reply('🛒 Shopping cart is empty');
            } else {
                const items = cart.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
                await interaction.reply(`🛒 **Shopping Cart:**\n${items}`);
            }
            break;
        case 'shopped': // remove item from card
            const itemToRemove = interaction.options.getString('item', true);
            await removeItemFromCart(itemToRemove);
            if (itemToRemove === 'all') {
                await interaction.reply('Cleared the shopping list 🛒');
            }else{
                await interaction.reply(`Removed "${itemToRemove}" from the shopping list 🛒`);
            }
            break;
        case 'note': // take notes
            const note = interaction.options.getString('note', true);
            await addNote(note);
            await interaction.reply(`Added "${note}" to the notes 📝`);
            break;
        case 'list-notes': // list all notes
            const notes = await readNotes();
            if (notes.length === 0) {
                await interaction.reply('📝 Notes are empty');
            } else {
                const notesList = notes.map((note, idx) => `${idx + 1}. ${note}`).join('\n');
                await interaction.reply(`📝 **Notes:**\n${notesList}`);
            }
            break;
        case 'delete-note': // delete a note
            const noteToDelete = interaction.options.getString('note', true);
            await removeNoteFromNotes(noteToDelete);
            if (noteToDelete === 'all') {
                await interaction.reply('Cleared the notes 📝');
            }else{
                await interaction.reply(`Deleted "${noteToDelete}" from the notes 📝`);
            }
            break;
        case 'save-file': // save a file
            const file: Attachment = interaction.options.getAttachment('file', true)
            const description: string = interaction.options.getString('description', true);
            // defer reply to avoid timeout
            await interaction.deferReply();
            await addFile(file.url, description, interaction.channelId, interaction.id);
            await interaction.editReply(`Saved "${file.url}" to the file 📂`);
            break;
        case 'get-file': // get a file
            break;
            
        default:
            await interaction.reply({ content: 'Unknown command', ephemeral: true });
            break;
    }
  } catch (error) {
    console.error('Slash command handler error:', error);
    // check if interaction is replied or deferred
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Something went wrong…', ephemeral: true });
    } else {
      // if already replied, use followUp to send follow up message
      await interaction.followUp({ content: 'Something went wrong…', ephemeral: true });
    }
  }
}
