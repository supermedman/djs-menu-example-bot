import {
    ComponentCollectorOptionBase,
    handleCatchDelete,
    MenuDataContentBase,
    MenuManager,
    MenuManagerOptionBase,
    PagerDataOptionBase,
    Paginator,
    spawnBackButtonRow,
    spawnCollector,
    spawnUserChoiceRow
} from "@th3ward3n/djs-menu";
import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    MessageFlags,
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle
} from "discord.js";
import ExtendedClient from "../../classes/client";
import { ChatInputCommand } from "../../interfaces";

interface TestArguments {
    txt: {
        one: string;
        two: string;
        three: string;
    };
    int: {
        one: number;
        two: number;
        three: number;
    };
}

async function execute(_: ExtendedClient, interaction: ChatInputCommandInteraction) {
    const testName = interaction.options.getString('sandbox_context', true);
    const collectedArgs: TestArguments = {
        txt: {
            one: interaction.options.getString('string_arg_one') ?? "",
            two: interaction.options.getString('string_arg_two') ?? "",
            three: interaction.options.getString('string_arg_three') ?? ""
        },
        int: {
            one: interaction.options.getInteger('number_arg_one') ?? 0,
            two: interaction.options.getInteger('number_arg_two') ?? 0,
            three: interaction.options.getInteger('number_arg_three') ?? 0
        }
    };

    type CallableContextTest = (
        i: ChatInputCommandInteraction,
        args: TestArguments
    ) => Promise<unknown>;

    let callableTest: CallableContextTest;
    switch (testName) {
        case "basic collector":
            callableTest = basicCollectorTest;
            break;
        case "basic pager":
            callableTest = basicPagingTest;
            break;
        case "basic menu":
            callableTest = basicMenuTest;
            break;
        default:
            return await interaction.reply({
                content: `Invalid sandbox context: No context matching ${testName}!`,
                flags: MessageFlags.Ephemeral
            });
    }

    return await callableTest(interaction, collectedArgs); // .catch(console.error);
}

//#region sandbox tests

async function basicCollectorTest(i: ChatInputCommandInteraction, args: TestArguments) {
    const exampleDisplay = {
        embeds: [
            new EmbedBuilder({
                title: "This is a simple User Choice Embed",
                description: "Confirm or Cancel?"
            })
        ],
        components: [spawnUserChoiceRow((args.txt.one) ? args.txt.one : "Example Text")]
    };

    // Example option object, specifying expire timer and collectors to return
    const exampleOptions: ComponentCollectorOptionBase = {
        timeLimit: 180_000,
        sendAs: "Reply",
        collectors: {
            type: "Button",
        }
    };

    // Collector Spawning Response object
    /**
     * @example Using Destructing
     * ```ts
     * const { anchorMsg, buttons, strings } = await spawnCollector(i, exampleDisplay, exampleOptions);
     * ```
     */
    const packedResponse = await spawnCollector(i, exampleDisplay, exampleOptions);

    // Event Fires for any button interactions that pass filtering
    // Custom Filters can be passed to the spawner using `collectors: { filterWith: () => boolean }`
    packedResponse.buttons.on('collect', (collected) => {
        collected.deferUpdate().then(async () => {

            await collected.followUp({
                content: `Button Collected with customId: ${collected.customId}`,
                flags: MessageFlags.Ephemeral
            });

        }).catch(console.error);
    });

    // Event fires on the collector ending, if given a reason through `buttons.stop("reason")` it will fill the `reason` argument on "end"
    // If the collector ends due to the given timeLimit (default 60_000ms or 60 seconds) the "end" event will fire with `reason: "time"`
    packedResponse.buttons.on('end', (collected, reason) => {
        if (!reason || reason === 'time') handleCatchDelete(packedResponse.anchorMsg);
        console.log('Collected Components: ', collected);
        console.log('Ended with reason: ', reason);
    });
}


async function basicPagingTest(i: ChatInputCommandInteraction, args: TestArguments) {
    const examplePageData: PagerDataOptionBase = {
        embeds: Array((!args.int.one) ? 5 : Math.max(args.int.one, 25))
            .fill(0).map<EmbedBuilder>((_, idx) =>
                new EmbedBuilder({
                    title: `Page #${idx + 1}`,
                    description: "This is a page, it is one of many"
                }),
            ),
    };

    // Example option object, specifying expire timer and collectors to return
    const exampleOptions: ComponentCollectorOptionBase = {
        timeLimit: 180_000,
        sendAs: "Reply",
        collectors: {
            type: "Button",
        }
    };

    const pager = new Paginator(examplePageData);

    const {
        anchorMsg,
        buttons,
    } = await spawnCollector(i, pager.page, exampleOptions);


    buttons.on('collect', (collected) => {
        collected.deferUpdate().then(async () => {

            await anchorMsg.edit(pager.changePage(
                collected.customId.split('-')[0]
            ));

            // await collected.followUp({
            //     content: `Button Collected with customId: ${collected.customId}`,
            //     flags: MessageFlags.Ephemeral
            // });

        }).catch(console.error);
    });

    buttons.on('end', (_, reason) => {
        if (!reason || reason === 'time') handleCatchDelete(anchorMsg);
    });
}


async function basicMenuTest(i: ChatInputCommandInteraction, args: TestArguments) {
    const sharedBackRow = spawnBackButtonRow();

    const frameSize = (!args.int.one)
        ? 5 : Math.max(25, args.int.one);

    const exampleFrameData: MenuDataContentBase[] = Array(frameSize).fill(0)
        .map<MenuDataContentBase>(
            (_, idx) => ({
                embeds: [
                    new EmbedBuilder({
                        title: `Frame #${idx + 1}`,
                        description: "This is a frame in a menu, it is one of many!"
                    }),
                ],
                components: (idx === frameSize - 1) ? [sharedBackRow] : [
                    new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder({
                                custom_id: `frame-${idx}-main`,
                                style: ButtonStyle.Primary,
                                label: "Do something!"
                            }),
                            new ButtonBuilder({
                                custom_id: `frame-${idx}-alt`,
                                style: ButtonStyle.Secondary,
                                label: "Do Something else!"
                            })
                        ).toJSON(),
                    sharedBackRow
                ],
            }),
        );
    const exampleMenuOptions: MenuManagerOptionBase = {
        contents: exampleFrameData[0],
        sendAs: "Reply",
        timeLimit: 300_000
    };

    const menu = await MenuManager.createAnchor(i, exampleMenuOptions);

    menu.buttons?.on('collect', (c) => {
        c.deferUpdate().then(async () => {

            switch (menu.analyzeAction(c.customId)) {
                case "PAGE":
                    // Not in use for this example!
                    break;
                case "NEXT":
                    // Move forward one context frame
                    await menu.frameForward(exampleFrameData[menu.position]);
                    break;
                case "BACK":
                case "CANCEL":
                    // Move backwards one context frame
                    await menu.frameBackward();
                    break;
                case "UNKNOWN":
                    // Unknown action, refresh current frame!
                    await menu.frameRefresh();
                    break;
            }

            // await c.followUp({
            //     content: `Collected Button: ${c.customId}`,
            //     flags: MessageFlags.Ephemeral
            // });

        }).catch(console.error);
    });

    menu.buttons?.on('end', (_, r) => {
        if (!r || r === 'time') menu.destroy();
    });
}


//#endregion

const command: ChatInputCommand = {
    options: new SlashCommandBuilder()
        .setName('sandbox')
        .setDescription('Development Sandbox')
        .addStringOption(option =>
            option
                // Allows changes without requiring command redeploy
                .setName('sandbox_context')
                .setDescription('Dynamic sandbox options, required for test context')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('string_arg_one')
                .setDescription('First Optional String Input')
        )
        .addStringOption(option =>
            option
                .setName('string_arg_two')
                .setDescription('Second Optional String Input')
        )
        .addStringOption(option =>
            option
                .setName('string_arg_three')
                .setDescription('Third Optional String Input')
        )
        .addIntegerOption(option =>
            option
                .setName('number_arg_one')
                .setDescription('First Optional Number Input')
        )
        .addIntegerOption(option =>
            option
                .setName('number_arg_two')
                .setDescription('Second Optional Number Input')
        )
        .addIntegerOption(option =>
            option
                .setName('number_arg_three')
                .setDescription('Third Optional Number Input')
        ),
    execute
};

export default command;