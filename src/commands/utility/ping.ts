import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { ChatInputCommand } from "../../interfaces";
import ExtendedClient from "../../classes/client";

async function execute(_: ExtendedClient, interaction: ChatInputCommandInteraction) {
    await interaction.reply({ content: "Pinging...", withResponse: true });
    const replied = await interaction.fetchReply();
    await interaction.editReply(`Roundtrip latency: ${replied.createdTimestamp - interaction.createdTimestamp}ms`);
}

const command: ChatInputCommand = {
    options: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Test API Latency'),
    execute
};

export default command;