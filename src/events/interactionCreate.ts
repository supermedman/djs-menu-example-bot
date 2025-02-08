import { ApplicationCommandType, Events, Interaction, InteractionType, RepliableInteraction } from "discord.js";
import ExtendedClient from "../classes/client";

const errorMessage = "There was an error while executing this interaction!";

async function replyError(error: unknown, interaction: RepliableInteraction) {
    if (error instanceof Error) {
        console.error(error);
        if (interaction.deferred) {
            await interaction.followUp({ content: errorMessage }).catch(console.error);
        } else {
            await interaction.reply({ content: errorMessage }).catch(console.error);
        }
    }
}


const event = {
    name: Events.InteractionCreate,
    async execute(client: ExtendedClient, interaction: Interaction) {
        try {
            switch (interaction.type) {
                case InteractionType.ApplicationCommand:
                    // Check ApplicationCommandType
                    switch (interaction.commandType) {
                        case ApplicationCommandType.ChatInput:
                            // Execute command
                            client.commands.get(interaction.commandName)?.execute(client, interaction);
                            break;
                        default:
                            break;
                    }
                    break;
                case InteractionType.MessageComponent:
                    // Not Used
                    break;
                case InteractionType.ApplicationCommandAutocomplete:
                    // Not Used
                    break;
                default:
                    break;
            }
        } catch (error) {
            if (interaction.isRepliable()) replyError(error, interaction)
            else console.error(error);
        }

    }
};

export default event;