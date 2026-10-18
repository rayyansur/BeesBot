import 'dotenv/config';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Simple test command
const TEST_COMMAND = {
    name: 'test',
    description: 'Basic command',
    type: 1,
    integration_types: [0, 1],
    contexts: [0, 1, 2],
};

const COINFLIP = {
    name: 'coinflip',
    description: 'Skebob flips coins',
    type: 1,
    options: [
        {
            name: "amount",
            description: "From 2 to 5",
            type: 4,
            required: false,
            min_value: 2,
            max_value: 5
        }
    ]
}

const SACRIFICE = {
    name: 'sacrifice',
    description: 'Sacrifices some and returns a certain number of people from input list',
    type: 1,
    options: [
        {
            name: "list",
            description: "comma seperated list of names",
            type: 3,
            required: true,
        },
        {
            name: "number",
            description: "number of people to pick from list",
            type: 4,
            required: true,
            min_value: 1
        }
    ]
};

const SAVE_IDEA = {
    name: 'save_idea',
    description: 'Input an idea name and it\'s description',
    type: 1,
    options: [
        {
            name: "name",
            description: "idea name",
            type: 3,
            required: true,
        },
        {
            name: "desc",
            description: "description of idea",
            type: 3,
            required: true,
        }
    ]
}

const FETCH_IDEA = {
    name: 'fetch_idea',
    description: 'Fetch an idea\'s description from it\'s name',
    type: 1,
    options: [
        {
            name: "name",
            description: "name of idea",
            type: 3,
            required: true
        }
    ]
}

const ALL_IDEAS = {
    name: 'all_ideas',
    description: 'returns all the names of the saved ideas',
    type: 1
}

const TOURNAMENT = {
    name: 'tournament',
    description: 'Makes a fair random tournament bracket from mentioned players',
    type: 1,
    options: [
        {
            name: "players",
            description: "mention everyone playing, e.g. @a @b @c",
            type: 3,
            required: true,
        }
    ]
}

const ALL_COMMANDS = [TEST_COMMAND, COINFLIP, SACRIFICE, SAVE_IDEA, FETCH_IDEA, ALL_IDEAS, TOURNAMENT];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
