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
  new SlashCommandBuilder()
    .setName('note')
    .setDescription('Take notes')
    .addStringOption((opt) =>
      opt
        .setName('note')
        .setDescription('Note to add')
        .setRequired(true),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('list-notes')
    .setDescription('List all notes')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('delete-note')
    .setDescription('Delete a note')
    .addStringOption((opt) =>
      opt
        .setName('note')
        .setDescription('Note to delete')
        .setRequired(true),
    )
    .toJSON(),
];

async function registerCommands() {
  if (guildId) {
    // register to specific Guild (development environment, immediate effect)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`✅ Guild slash registered to ${guildId}`);
    
    // FIXME: clear global commands
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log('✅ Global commands cleared');
  } else {
    // register as global command
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('✅ Global slash registered (may take time to propagate)');
  }
}

client.on(Events.InteractionCreate, async (interaction : Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleSlashCommand(interaction);
});

// log in and register commands
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
  try {
    await registerCommands();
  } catch (e) {
    console.error('Slash registration failed:', e);
  }
});

client.login(token);
