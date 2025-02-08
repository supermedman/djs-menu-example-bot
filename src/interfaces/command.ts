import {
    ChatInputCommandInteraction,
    CommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import ExtendedClient from "../classes/client.js";

type AnySlashCommandBuilder =
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | SlashCommandOptionsOnlyBuilder;

export interface Command {
    options: AnySlashCommandBuilder;
    execute(
        client: ExtendedClient,
        interaction: CommandInteraction,
    ): Promise<void | unknown>;
}

export interface ChatInputCommand extends Command {
    options: AnySlashCommandBuilder;
    execute(
        client: ExtendedClient,
        interaction: ChatInputCommandInteraction,
    ): Promise<void | unknown>;
}