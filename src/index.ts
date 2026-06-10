import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, Interaction, Message } from 'discord.js';
import 'dotenv/config';
import { handleSlashCommand } from './interaction';
import { fetchClaude } from './claude';
import http from 'http';
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

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  
  if (message.mentions.has(client.user!, { ignoreEveryone: true, ignoreRoles: true })) {// bot is mentioned by user
    // remove bot mention part from message content
    const messageContent = message.content.replace(`<@${client.user?.id}>`, '').trim();

    const reply = await fetchClaude(messageContent);
    await message.reply(reply);
  }
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

// Create HTTP server for Render
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      bot: client.user?.tag || 'connecting...',
      uptime: process.uptime()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});
