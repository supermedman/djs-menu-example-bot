import ExtendedClient from '../classes/client.js';
import { ClientEvents as DiscordClientEvents } from 'discord.js';

export interface Event {
    name: keyof DiscordClientEvents;
    once?: boolean;
    execute(client: ExtendedClient, ...args: any[]): void;
}