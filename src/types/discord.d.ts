// import { Client, Collection, SlashCommandOptionsOnlyBuilder, AutocompleteInteraction, SlashCommandSubcommandsOnlyBuilder, ChatInputCommandInteraction } from "discord.js";

// type SlashCommandBuilderTypes = SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

// export interface CommandFormat {
//     data: SlashCommandBuilderTypes;
//     execute(interaction: ChatInputCommandInteraction): Promise<unknown>;
// }

// export type StoredCommands = Collection<string, CommandFormat>;

// declare module 'discord.js' {
//     export interface Client {
//         commands: StoredCommands;
//     }
// }