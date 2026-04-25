import { Client, GatewayIntentBits } from 'discord.js';
import ollama from 'ollama';

const TARGET_IDS = process.env.FLAME_TARGET_IDS?.split(',').map(id => id.trim()).filter(Boolean) ?? [];
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.once('clientReady', () => {
    console.log(`Flamer ready — watching ${TARGET_IDS.length} user(s)`);
});

client.on('messageCreate', async (message) => {
    console.log(`[flamer] ${message.author.id} (${message.author.username}): "${message.content}"`);
    if (message.author.bot) return;
    if (!TARGET_IDS.includes(message.author.id)) return;
    if (!message.content.trim()) return;

    try {
        const response = await ollama.chat({
            model: MODEL,
            messages: [{
                role: 'user',
                content: `You are a witty Discord bot. Roast the following message in a funny, lighthearted way. Be brief (1-2 sentences max), punchy, and don't be mean-spirited. Message: "${message.content}"`
            }]
        });
        await message.reply(response.message.content);
    } catch (e) {
        console.error('Flamer error:', e.message);
    }
});

client.login(process.env.DISCORD_TOKEN);
