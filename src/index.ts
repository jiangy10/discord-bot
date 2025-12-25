import { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, Interaction, Message } from 'discord.js';
import 'dotenv/config';
import { addItemToCart, readCart } from './storage';
import { handleSlashCommand } from './interaction';
import http from 'http';
import { fetchJobPost } from './fetchJob';

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
  new SlashCommandBuilder()
    .setName('save-file')
    .setDescription('Save a file')
    .addAttachmentOption((opt) =>
      opt
        .setName('file')
        .setDescription('File to save')
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName('description')
        .setDescription('Description of the file')
        .setRequired(true),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('get-file')
    .setDescription('Get a file')
    .addStringOption((opt) =>
      opt
        .setName('keyword')
        .setDescription('File name or any keyword')
        .setRequired(true),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('meal')
    .setDescription('Add a meal to meal plan')
    .addStringOption((opt) =>
      opt
        .setName('meal')
        .setDescription('Meal to add')
        .setRequired(true),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('list-meals')
    .setDescription('List all meals')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('delete-meal')
    .setDescription('Delete a meal from meal plan')
    .addStringOption((opt) =>
      opt
        .setName('meal')
        .setDescription('Meal to delete')
        .setRequired(true),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Set a reminder')
    .addStringOption((opt) =>
      opt
        .setName('date')
        .setDescription('Date of the reminder')
        .setRequired(true),
    ).addStringOption((opt) =>
      opt
        .setName('description')
        .setDescription('Description of the reminder')
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

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  
  if (message.mentions.has(client.user!, { ignoreEveryone: true, ignoreRoles: true })) {// bot is mentioned by user
    // remove bot mention part from message content
    const messageContent = message.content.replace(`<@${client.user?.id}>`, '').trim();
    fetchJobPost(12, {
      keywords: "Software Engineer",
      geoId: "103644278",
      locationAllowlist: ["San Francisco", "Bay Area", "Remote", "San Jose", "Palo Alto", "Sunnyvale", "Mountain View", "Santa Clara", "Cupertino", "Redwood City", "CA"],
      maxResults:5,
    }).then(
      (jobs) => {
        const jobList = jobs.map((job) => 
          `- Title: ${job.title}\n\tCompany: ${job.company}\n\tLocation: ${job.location}\n\tURL: ${job.url}`).join('\n');
        message.reply(`Here are the latest job postings:\n${jobList}`);
      }
    );
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
