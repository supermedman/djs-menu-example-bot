import { Events } from "discord.js";
import ExtendedClient from "../classes/client";

const event = {
    name: Events.ClientReady,
    once: true,
    async execute(client: ExtendedClient) {
        if (process.argv.includes('--use-deploy')) await client.deploy();
        console.log(`Ready! Logged in as ${client.user?.tag}`);
    }
};

export default event;