import 'dotenv/config';
import {MessageComponentTypes} from 'discord-interactions';
import {con} from './db_connection.js';

export async function DiscordRequest(endpoint, options) {
    // append endpoint to root API URL
    const url = 'https://discord.com/api/v10/' + endpoint;
    // Stringify payloads
    if (options.body) options.body = JSON.stringify(options.body);
    // Use fetch to make requests
    const res = await fetch(url, {
        headers: {
            Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': 'DiscordBot (https://github.com/discord/discord-example-app, 1.0.0)',
        },
        ...options
    });
    // throw API errors
    if (!res.ok) {
        const data = await res.json();
        console.log(res.status);
        throw new Error(JSON.stringify(data));
    }
    // return original response
    return res;
}

export async function InstallGlobalCommands(appId, commands) {
    // API endpoint to overwrite global commands
    const endpoint = `applications/${appId}/commands`;

    try {
        // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
        await DiscordRequest(endpoint, { method: 'PUT', body: commands });
    } catch (err) {
        console.error(err);
    }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
    const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
    return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function getHeadTail(strArr) {
    return strArr[Math.floor(Math.random() * strArr.length)];
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function makesRow(component) {
    return {
        type: MessageComponentTypes.ACTION_ROW,
        components: [component]
    };
}

export function chooseFromList(str, num) {
    console.log(str, num)

    str = str.toLowerCase();
    str = str.replaceAll("aryen", "gujarat iyer");

    let arr = str.split(",").map(x => x.trim());

    while (num < arr.length && arr.length !== 0) {
        arr.pop(Math.floor(Math.random() * arr.length));
    }

    return arr;
}

export function makeTournament(playersStr) {
    // pull out the user mentions, dropping duplicates
    const players = [...new Set([...playersStr.matchAll(/<@!?\d+>/g)].map(m => m[0]))];

    if (players.length < 2) {
        return "Need at least 2 players, mention them like: /tournament players: @a @b @c";
    }
    if (players.length > 64) {
        return "Max 64 players, this isn't the world cup";
    }

    // Fisher-Yates shuffle for fair random seeding
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }

    const lines = [`🏆 **TOURNAMENT** 🏆 (${players.length} players)`];

    if (Number.isInteger(Math.log2(players.length))) {
        // power of 2: straight knockout, zero byes by construction
        pushKnockout(lines, players);
    } else if (players.length <= 5) {
        // 3 or 5 players: a bracket would force byes, so play a round robin
        pushRoundRobin(lines, players);
    } else {
        // deal into the smallest power-of-2 number of groups with ≤5 players
        // each, so the group winners fill a bracket with no byes
        let groupCount = 2;
        while (Math.ceil(players.length / groupCount) > 5) groupCount *= 2;

        const groups = Array.from({ length: groupCount }, () => []);
        players.forEach((p, i) => groups[i % groupCount].push(p));

        lines.push("", "**Group Stage** — each group is a round robin, most wins advances (tie for first → tiebreaker match)");
        groups.forEach((g, i) => lines.push(`Group ${groupLabel(i)}: ${g.join(", ")}`));

        pushKnockout(lines, groups.map((_, i) => `Winner of Group ${groupLabel(i)}`));
    }

    return lines.join("\n");
}

// appends a knockout bracket; entrants.length must be a power of 2
function pushKnockout(lines, entrants) {
    let matchNum = 1;
    let advancing = entrants;
    while (advancing.length > 1) {
        lines.push("", roundName(advancing.length / 2));
        const next = [];
        for (let i = 0; i < advancing.length; i += 2) {
            lines.push(`Match ${matchNum}: ${advancing[i]} vs ${advancing[i + 1]}`);
            next.push(`Winner of Match ${matchNum++}`);
        }
        advancing = next;
    }
}

// circle method: fix the first slot, rotate the rest each round; with an odd
// player count the one paired against the null slot rests that round
function pushRoundRobin(lines, players) {
    lines.push("", "**Round Robin** — everyone plays everyone once, most wins is champion (tie for first → tiebreaker match)");
    const ring = players.length % 2 === 0 ? [...players] : [...players, null];
    for (let r = 1; r < ring.length; r++) {
        const matches = [];
        let resting = null;
        for (let i = 0; i < ring.length / 2; i++) {
            const a = ring[i];
            const b = ring[ring.length - 1 - i];
            if (a === null) resting = b;
            else if (b === null) resting = a;
            else matches.push(`${a} vs ${b}`);
        }
        lines.push(`Round ${r}: ${matches.join(", ")}${resting ? ` — ${resting} rests` : ""}`);
        ring.splice(1, 0, ring.pop());
    }
}

function groupLabel(i) {
    return String.fromCharCode(65 + i); // A, B, C, ...
}

function roundName(matchCount) {
    if (matchCount === 1) return "**Final**";
    if (matchCount === 2) return "**Semifinals**";
    if (matchCount === 4) return "**Quarterfinals**";
    return `**Round of ${matchCount * 2}**`;
}

export function getResultInsert(name, desc) {

    return new Promise((resolve, reject) => {
        con.connect(function (err) {
            if (err) {
                reject("failed, contact hydronoob");
            }
            let sql = "INSERT INTO ideas (name, description) VALUES ?";
            let values = [[name, desc]];

            con.query(sql, [values], function (err, result) {
                if (!err) {
                    resolve("inserted");
                } else {
                    reject("failed, contact hydronoob");
                }
            });
        });
    });
}