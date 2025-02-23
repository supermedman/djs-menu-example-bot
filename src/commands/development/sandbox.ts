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
import { incRandNum } from "../../utils/index.js";

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
    client: ExtendedClient;
}

async function execute(client: ExtendedClient, interaction: ChatInputCommandInteraction) {
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
        },
        client
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
        case "paging menu":
            callableTest = pagingMenuTest;
            break;
        case "help menu":
            callableTest = advancedPagingMenuTest;
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


async function pagingMenuTest(i: ChatInputCommandInteraction, args: TestArguments) {
    const sharedBackRow = spawnBackButtonRow();

    const frameSize = (!args.int.one)
        ? 5 : Math.max(25, args.int.one);
    const pageSize = (!args.int.two)
        ? 5 : Math.max(25, args.int.two);

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

    const randomPagerFrame = incRandNum(0, frameSize - 1);

    const examplePageData: PagerDataOptionBase = {
        embeds: Array(pageSize).fill(0).map<EmbedBuilder>(
            (_, idx) =>
                new EmbedBuilder({
                    title: `Frame #${randomPagerFrame + 2}/Page #${idx + 1}`,
                    description: "This is a page, it is one of many"
                }),
        ),
    };

    const exampleMenuOptions: MenuManagerOptionBase = {
        contents: exampleFrameData[0],
        sendAs: "Reply",
        timeLimit: 300_000
    };

    const menu = await MenuManager.createAnchor(i, exampleMenuOptions);

    // Initilizing a new internal Paginator (Omitting `id`)
    menu.spawnPageContainer(examplePageData);

    menu.buttons?.on('collect', (c) => {
        c.deferUpdate().then(async () => {

            switch (menu.analyzeAction(c.customId)) {
                case "PAGE":
                    // Move forward one context page on the current frame
                    await menu.framePageChange(c.customId);
                    break;
                case "NEXT":
                    // Check if page injection should occur
                    if (menu.position - 1 === randomPagerFrame) {
                        // As the `id` was omitted during paginator creation, `usePager` should be set to true.
                        // You can also set `usePager: '0'` however this is NOT SUGGESTED
                        await menu.frameForward(exampleFrameData[menu.position], { usePager: true });

                        // Move forward one context frame
                    } else await menu.frameForward(exampleFrameData[menu.position]);
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


async function advancedPagingMenuTest(i: ChatInputCommandInteraction, _: TestArguments) {
    const sharedBackRow = spawnBackButtonRow();

    /**
     * Main Menu (Frame 0 / Initial Message)
     */
    const exampleMainMenuDisplay = new EmbedBuilder({
        title: "== Select a Help Catagory ==",
        description: "> `Fun`\n> `Utility`\n> `Other`"
    });
    const exampleMainMenuControls = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder({
            custom_id: "fun",
            style: ButtonStyle.Secondary,
            label: "Fun Commands"
        }),
        new ButtonBuilder({
            custom_id: "utility",
            style: ButtonStyle.Secondary,
            label: "Utility Commands"
        }),
        new ButtonBuilder({
            custom_id: "other",
            style: ButtonStyle.Secondary,
            label: "Other Commands"
        }),
    ).toJSON();


    /**
     * Injected Placeholder Frame
     * 
     * This method of using placeholders is not desired, it is however currently required.
     * Work is being done to solve this concept in the base @th3ward3n/djs-menu package
     */
    const exampleEmptyDisplay = new EmbedBuilder({
        title: "== This will never be seen =="
    });

    /**
     * Sub Menus (Frame 1 / Injected Per Selected Catagory)
     */
    const exampleCommandNames = {
        fun: ["cute-animal", "meme", "urban-dictonary"],
        utility: ["command-use-stats", "help", "profile"],
        other: ["ping", "info"]
    };

    const loadHelpCommandPages = (names: string[]) => {
        return {
            embeds: Array(names.length).fill(0).map<EmbedBuilder>(
                (_, idx) =>
                    new EmbedBuilder({
                        title: `= How to use ${names[idx]} =`,
                        description: "This is an example help page for a command!"
                    }),
            ),
        };
    };

    const exampleFunCommandPages = loadHelpCommandPages(exampleCommandNames.fun);
    const exampleUtilityCommandPages = loadHelpCommandPages(exampleCommandNames.utility);
    const exampleOtherCommandPages = loadHelpCommandPages(exampleCommandNames.other);

    // interface ExtendedMenuFrameContainer {
    //     [subFrame: string]: MenuDataContentBase;
    // }

    const exampleFrameData: MenuDataContentBase[] = [
        {
            embeds: [exampleMainMenuDisplay],
            components: [exampleMainMenuControls]
        },
        {
            embeds: [exampleEmptyDisplay],
            components: [sharedBackRow]
        }
    ];

    const exampleMenuOptions: MenuManagerOptionBase = {
        contents: exampleFrameData[0],
        sendAs: "Reply",
        timeLimit: 300_000
    };

    const menu = await MenuManager.createAnchor(i, exampleMenuOptions);

    // Attach internal Paginators using unique ids
    /**
     * @note Given `id`s should be able to exactly match a button/stringSelect `custom_id`
     * @example
     * ```ts
     * menu.spawnPageContainer(pageData, "uniqueid");
     * 
     * // INCORRECT 
     * const WRONG_ExampleButton = new ButtonBuilder()
     *      .setCustomId("action-something-uniqueid");
     * const WRONG_ExampleButtonTwo = new ButtonBuilder()
     *      .setCustomId("action-uniqueid-something");
     * 
     * // CORRECT!!
     * const CORRECT_ExampleButton = new ButtonBuilder()
     *      .setCustomId("uniqueid-action-something");
     * ```
     */
    menu.spawnPageContainer(exampleFunCommandPages, "fun");
    menu.spawnPageContainer(exampleUtilityCommandPages, "utility");
    menu.spawnPageContainer(exampleOtherCommandPages, "other");

    menu.buttons?.on('collect', (c) => {
        c.deferUpdate().then(async () => {

            switch (menu.analyzeAction(c.customId)) {
                case "PAGE":
                    // Handle paging internally
                    await menu.framePageChange(c.customId);
                    break;
                case "NEXT":
                    // In this example, any button pressed on the first frame will require a paginator injection
                    // Here we are loading the placeholder frame embeds, and specifing the paging `id` to inject with
                    // Refer to the example shown above the paginator attachment step.
                    if (menu.position === 1) {
                        await menu.frameForward(
                            exampleFrameData[menu.position],
                            { usePager: c.customId.split('-')[0] }
                        );
                    }
                    break;
                case "BACK":
                case "CANCEL":
                    await menu.frameBackward();
                    break;
                case "UNKNOWN":
                    await menu.frameRefresh();
                    break;
            }

            await c.followUp({
                content: `Collected Button: ${c.customId}`,
                flags: MessageFlags.Ephemeral
            });

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