// import { REST, Routes } from "discord.js";

// import { fileURLToPath } from "node:url";
// import { dirname } from "node:path";
// import fs from 'node:fs';
// import path from 'node:path';
// import { ChatInputCommand } from "../interfaces";

// const __filename = path.resolve(fileURLToPath(import.meta.url) + "/../../dist");
// const __dirname = dirname(__filename);

// const commands = [];

// const foldersPath = path.join(__dirname, 'commands');
// const commandFolders = fs.readdirSync(foldersPath);

// for (const folder of commandFolders) {
//     const commandsPath = path.join(foldersPath, folder);
//     const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
//     // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
//     for (const file of commandFiles) {
//         const filePath = path.join('file://', commandsPath, file);
//         import(filePath).then(
//             (command: {default: ChatInputCommand }) => {
//                 if ('options' in command && 'execute' in command) {
//                     commands.push(command.options.toJSON());
//                 } else {
//                     console.log(`[WARNING] The command at ${filePath} is missing a required "options" or "execute" property.`);
//                 }
//             }
//         )
//     }
// }

// try {
    

//     (async () => {
//         if (
//             typeof process.env.CLIENT_TOKEN !== 'string' ||
//             typeof process.env.CLIENT_ID !== 'string' ||
//             typeof process.env.LOCAL_DEV_GUILD_ID !== 'string'
//         ) throw new Error("[ABORT DEPLOY] Failed to retrive .env contents!!");

//         const rest = new REST().setToken(process.env.CLIENT_TOKEN);

//         console.log(`Refreshing ${commands.length} commands...`);

//         const data: any = await rest.put(
//             Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.LOCAL_DEV_GUILD_ID),
//             { body: commands },
//         );

//         if ('length' in data)
//             console.log(`Successfully reloaded ${data.length} commands`);
//     })
    
// } catch (error) {
//     console.error(error);
// }