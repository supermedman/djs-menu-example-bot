import { GatewayIntentBits as Intents } from "discord.js";
import ExtendedClient from "./classes/client.js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const client = new ExtendedClient({
    intents: [
        Intents.Guilds,
        Intents.GuildMessages
    ]
});

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const eventsPath = path.join(__dirname, 'events');
// const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

// for (const file of eventFiles) {
//     const filePath = path.join('file://', eventsPath, file);
//     const { default: event } = await import(filePath);

//     if (event.once) {
//         client.once(event.name, (...args) => event.execute(...args));
//     } else {
//         client.on(event.name, (...args) => event.execute(...args));
//     }
// }

// client.commands = new Collection();

// const foldersPath = path.join(__dirname, 'commands');
// const commandFolder = fs.readdirSync(foldersPath);

// for (const folder of commandFolder) {
//     const commandsPath = path.join(foldersPath, folder);
//     const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

//     if (!commandFiles.length) continue;

//     for (const file of commandFiles) {
//         const filePath = path.join('file://', commandsPath, file);
//         const { default: command } = await import(filePath);

//         if ('data' in command && 'execute' in command) {
//             client.commands.set(command.data.name, command);
//         } else {
//             console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
//         }
//     }
// }

//      ===================
//    Top Level Error Handling
//      ===================

process.on("unhandledRejection", async (err) => {
    console.error("Unhandled Promise Rejection:\n", err);
});
process.on("uncaughtException", async (err) => {
    console.error("Uncaught Promise Exception:\n", err);
});
process.on("uncaughtExceptionMonitor", async (err) => {
    console.error("Uncaught Promise Exception (Monitor):\n", err);
});

// Login after full Client init is complete
client.login(process.env.CLIENT_TOKEN);