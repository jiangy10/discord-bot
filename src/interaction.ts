import { ChatInputCommandInteraction } from 'discord.js';
import { addItemToCart, clearCart, readCart, removeItemFromCart } from './storage';

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
            if (itemToRemove === 'all') {
                await clearCart();
                await interaction.reply('Cleared the shopping list 🛒');
            }
            else{
                await removeItemFromCart(itemToRemove);
                await interaction.reply(`Removed "${itemToRemove}" from the shopping list 🛒`);
            }
            break;
        default:
            await interaction.reply({ content: 'Unknown command', ephemeral: true });
            break;
    }
  } catch (error) {
    console.error('Slash command handler error:', error);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: 'Something went wrong…', ephemeral: true });
    }
  }
}
