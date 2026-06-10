import { ChatInputCommandInteraction } from 'discord.js';
import { addItemToCart, readCart, readNotes, addNote } from './storage';

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
        default:
            await interaction.reply({ content: 'Unknown command', ephemeral: true });
            break;
    }
  } catch (error) {
    console.error('Slash command handler error:', error);
    // Try to respond to the interaction if possible
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Something went wrong… 😱', ephemeral: true });
      } else if (interaction.deferred) {
        await interaction.editReply({ content: 'Something went wrong… 😱' });
      } else {
        // if already replied, use followUp to send follow up message
        await interaction.followUp({ content: 'Something went wrong… 😱', ephemeral: true });
      }
    } catch (followUpError) {
      // If we can't respond to the interaction, just log the error
      console.error('Failed to send error message to user:', followUpError);
    }
  }
}
