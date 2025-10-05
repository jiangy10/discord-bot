import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config';
import { addItemToCart, readCart } from './storage';

const token = process.env.DISCORD_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;
const guildId = process.env.GUILD_ID; // for instant effect in development

if (!token || !clientId) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const rest = new REST({ version: '10' }).setToken(token);

//  Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Add an item to the shopping list')
    .addStringOption((opt) =>
      opt
        .setName('item')
        .setDescription('Item to add')
        .setRequired(true),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('list-cart')
    .setDescription('Show all items in the shopping cart')
    .toJSON(),
];

async function registerCommands() {
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`✅ Guild slash registered to ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('✅ Global slash registered (may take time to propagate)');
  }
}

function stripBotMention(content: string, botId: string) {
  const re = new RegExp(`<@!?${botId}>`, 'g');
  return content.replace(re, '').trim();
}

type Cmd = 'shop' | 'list' | 'list-cart' | 'help' | null;

function parseMentionCommand(text: string): { cmd: Cmd; args: string } {
  let t = text.trim();
  if (!t) return { cmd: null, args: '' };

  if (t.startsWith('/')) t = t.slice(1).trim();
  const [first, ...rest] = t.split(/\s+/);
  const argstr = rest.join(' ').trim();

  const map: Record<string, Cmd> = {
    shop: 'shop',
    list: 'list',
    'list-cart': 'list-cart',
    help: 'help',
  };

  const key = (first || '').toLowerCase();
  return { cmd: map[key] ?? null, args: argstr };
}

// Respond only when @mentioned; execute if "pseudo-slash" is present, otherwise "woof"
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !client.user) return;

  if (!message.mentions.users.has(client.user.id)) return; // React only when @mentioned

  const restText = stripBotMention(message.content, client.user.id);
  const { cmd, args } = parseMentionCommand(restText);

  try {
    if (!cmd) {
      await message.reply('woof');
      return;
    }

    if (cmd === 'shop') {
      if (!args) {
        await message.reply('Please provide an item, e.g., `@me /shop heavy cream`');
      } else {
        await addItemToCart(args);
        await message.reply(`Added "${args}" to the shopping list 🛒`);
      }
    } else if (cmd === 'list') {
      await message.reply('(demo) Shopping list is empty');
    } else if (cmd === 'list-cart') {
      const cart = await readCart();
      if (cart.length === 0) {
        await message.reply('🛒 Shopping cart is empty');
      } else {
        const items = cart.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
        await message.reply(`🛒 **Shopping Cart:**\n${items}`);
      }
    } else if (cmd === 'help') {
      await message.reply('Usage: `@me /shop <item>`, `@me /list-cart`, `@me /list`. e.g., `@me /shop heavy cream`');
    }
  } catch (e) {
    console.error('handler error:', e);
    await message.reply('Something went wrong…');
  }
});


client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'shop') {
    try {
      const item = interaction.options.getString('item', true);
      await addItemToCart(item);
      await interaction.reply(`Added "${item}" to the shopping list 🛒`);
    } catch (e) {
      console.error('slash handler error:', e);
      if (interaction.isRepliable()) {
        await interaction.reply({ content: 'Something went wrong…', ephemeral: true });
      }
    }
  } else if (interaction.commandName === 'list-cart') {
    try {
      const cart = await readCart();
      if (cart.length === 0) {
        await interaction.reply('🛒 Shopping cart is empty');
      } else {
        const items = cart.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
        await interaction.reply(`🛒 **Shopping Cart:**\n${items}`);
      }
    } catch (e) {
      console.error('slash handler error:', e);
      if (interaction.isRepliable()) {
        await interaction.reply({ content: 'Something went wrong…', ephemeral: true });
      }
    }
  }
});

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
  try {
    await registerCommands();
  } catch (e) {
    console.error('Slash registration failed:', e);
  }
});

client.login(token);
