import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, Interaction, Message } from 'discord.js';
import 'dotenv/config';
import { addItemToCart, readCart } from './storage';
import { handleSlashCommand } from './interaction';

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
  new SlashCommandBuilder()
    .setName('shopped')
    .setDescription('Remove an item from the shopping list')
    .addStringOption((opt) =>
      opt
        .setName('item')
        .setDescription('Item to remove')
        .setRequired(true),
    )
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

client.on(Events.InteractionCreate, async (interaction : Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleSlashCommand(interaction);
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
