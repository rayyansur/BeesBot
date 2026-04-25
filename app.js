import 'dotenv/config';
import './flamer.js';
import express from 'express';
import {
    ButtonStyleTypes,
    InteractionResponseFlags,
    InteractionResponseType,
    InteractionType,
    MessageComponentTypes,
    verifyKeyMiddleware,
} from 'discord-interactions';
import {getRandomEmoji, DiscordRequest, getHeadTail, makesRow, chooseFromList, getResultInsert} from './utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
    // Interaction id, type and data
    const { id, type, data, options} = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
        return res.send({ type: InteractionResponseType.PONG });
    }

    /**
     * Handle slash command requests
     * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
     */
    if (type === InteractionType.APPLICATION_COMMAND) {
        const { name } = data;

        // "test" command
        if (name === 'test') {
            // Send a message into the channel where command was triggered from
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        {
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            // Fetches a random emoji to send from a helper function
                            content: `Sup Basileus ${getRandomEmoji()}`
                        }
                    ]
                },
            });
        }

        if (name === 'coinflip') {

            let rowArr = [];
            const amount = data.options?.[0]?.value ?? 2; // default 2

            for (let i = 0; i < amount; i++) {
                rowArr.push(makesRow(
                    {
                        type: MessageComponentTypes.INPUT_TEXT,
                        style: 1,
                        label: 'Option: ' + (i + 1),
                        custom_id: i,
                    }
                ));
            }
            return res.send({
                type: InteractionResponseType.MODAL,
                 data: {
                    custom_id: 'bobFlip',
                    title: 'PICK RN',
                    components: rowArr

                }

            })

        }

        if (name === 'sacrifice') {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        {
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            content: `Winners are: ${chooseFromList(data.options?.[0].value, data.options?.[1].value)}`
                        }
                    ]
                }
            })
        }

        if (name === 'save_idea') {
            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
                    components: [
                        {
                            type: MessageComponentTypes.TEXT_DISPLAY,
                            content: `Results ${await getResultInsert(data.options?.[0].value, data.options?.[1].value)}`
                        }
                    ]
                }
            })
        }


        console.error(`unknown command: ${name}`);
        return res.status(400).json({ error: 'unknown command' });
    }

    if (type === InteractionType.MODAL_SUBMIT) {
        const modalID = data.custom_id;

        if (modalID === "bobFlip") {
            let inputString = [];
            for (let inputs of data.components) {
                inputString.push(inputs.components[0].value);
            }
            for (let string of inputString) {
                console.log(string);
            }
            console.log(inputString.length)


            return res.send({
                type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                data: {
                    content: `${getHeadTail(inputString)} wins`
                }
            });
        }
    }

    console.error('unknown interaction type', type);
    return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
    console.log('Listening on port', PORT);
});
