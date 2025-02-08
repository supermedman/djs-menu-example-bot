import {
    Client,
    ClientOptions,
    Collection
} from "discord.js";
import { readdirSync } from "fs";
import path, { dirname } from "path";
import {
    ChatInputCommand,
    Command,
    Event
} from "../interfaces/index";
import { fileURLToPath } from "url";

const __filename = path.resolve(fileURLToPath(import.meta.url) + "/../../dist");
const __dirname = dirname(__filename);

export default class ExtendedClient extends Client {
    /**
     * Collection of Chat Input Commands
     */
    readonly commands: Collection<string, ChatInputCommand>;

    /**
     * Collection of Events
     */
    readonly events: Collection<string, Event> = new Collection();

    constructor(options: ClientOptions) {
        super(options);

        const commandsPath = path.join(__dirname, "commands"),
            eventPath = path.join(__dirname, "events");

        this.commands = fileToCollection<ChatInputCommand>(commandsPath);

        readdirSync(eventPath)
            .filter(file => file.endsWith('.js'))
            .forEach(file =>
                import(path.join('file://', eventPath, file)).then(
                    (event: { default: Event }) => {
                        this.events.set(event.default.name, event.default)

                        if (event.default.once) {
                            this.once(event.default.name, (...args) =>
                                event.default.execute(this, ...args),
                            );
                        } else {
                            this.on(event.default.name, (...args) =>
                                event.default.execute(this, ...args),
                            );
                        }
                    },
                ),
            );
    }

    async deploy() {
        if (!this.application) return console.error('NO APPLICATION ABORT DEPLOY');

        const guildCommandList = Array.from(
            this.commands.values(),
        ).map((m) => m.options.toJSON());

        if (typeof process.env.LOCAL_DEV_GUILD_ID !== 'string') return console.error('NO GUILD ID ABORT DEPLOY');

        const guild = this.guilds.cache.get(process.env.LOCAL_DEV_GUILD_ID);

        if (!guild) return console.error('NO GUILD ABORT DEPLOY');

        const applicationGuildCommands = await this.application.commands.set(
            guildCommandList,
            guild.id,
        );

        console.log(`Commands Deployed: ${applicationGuildCommands.size}`);
    }
}

function fileToCollection<Type extends Command>(
    dirPath: string,
): Collection<string, Type> {
    const collection: Collection<string, Type> = new Collection();

    try {
        const dirents = readdirSync(dirPath, { withFileTypes: true });

        dirents
            .filter(dirent => dirent.isDirectory())
            .forEach(dir => {
                const directoryPath = path.join(dirPath, dir.name);
                readdirSync(directoryPath)
                    .filter(file => file.endsWith('.js'))
                    .forEach(file => {
                        import(path.join('file://', directoryPath, file)).then(
                            (resp: { default: Type }) => {
                                collection.set(resp.default.options.name, resp.default);
                            },
                        );
                    });
            });

        dirents
            .filter(dirent =>
                !dirent.isDirectory() &&
                dirent.name.endsWith('.js')
            )
            .forEach(file => {
                import(path.join(dirPath, file.name)).then(
                    (resp: { default: Type }) => {
                        collection.set(resp.default.options.name, resp.default);
                    },
                );
            });
    } catch (error) {
        if (
            isErrnoException(error) &&
            error.code == "ENOENT" &&
            error.syscall == "scandir"
        ) {
            console.warn(`[Warning] Directory not found at ${error.path}`);
        } else {
            throw error;
        }
    }

    return collection;
}

/**
 * Returns a boolean and Types a unkown as ErrnoException if the object is an error
 * @param error Any unkown object
 * @returns A boolean value if the the object is a ErrnoException
 */
function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error;
}