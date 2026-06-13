import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { makeTournament } from './utils.js';
import { con } from './db_connection.js';

// utils.js pulls in the MySQL connection; close it so the test runner exits
after(() => con.destroy());

function mention(i) {
    return `<@${i + 1}>`;
}

function input(n) {
    return Array.from({ length: n }, (_, i) => mention(i)).join(' ');
}

function countOccurrences(haystack, needle) {
    return haystack.split(needle).length - 1;
}

// unordered "A vs B" pairs pulled from match lines
function matchPairs(output) {
    return [...output.matchAll(/(<@!?\d+>) vs (<@!?\d+>)/g)]
        .map(m => [m[1], m[2]].sort().join('|'));
}

function groupLines(output) {
    return output.split('\n').filter(line => /^Group [A-Z]+:/.test(line));
}

test('rejects fewer than 2 players', () => {
    assert.match(makeTournament(''), /at least 2 players/i);
    assert.match(makeTournament(input(1)), /at least 2 players/i);
});

test('rejects more than 64 players', () => {
    assert.match(makeTournament(input(65)), /max 64/i);
});

test('never prints a BYE at any player count', () => {
    for (let n = 2; n <= 64; n++) {
        const out = makeTournament(input(n));
        assert.ok(!/bye/i.test(out), `found a bye with ${n} players:\n${out}`);
    }
});

test('every player appears in the output at every count', () => {
    for (let n = 2; n <= 64; n++) {
        const out = makeTournament(input(n));
        for (let i = 0; i < n; i++) {
            assert.ok(out.includes(mention(i)), `${mention(i)} missing with ${n} players`);
        }
    }
});

test('output stays under the 4000-char Discord limit at every count', () => {
    for (let n = 2; n <= 64; n++) {
        const out = makeTournament(input(n));
        assert.ok(out.length < 4000, `${out.length} chars with ${n} players`);
    }
});

test('powers of 2 stay a pure knockout: each player in exactly one match', () => {
    for (const n of [2, 4, 8, 16, 32, 64]) {
        const out = makeTournament(input(n));
        for (let i = 0; i < n; i++) {
            assert.equal(countOccurrences(out, mention(i)), 1,
                `${mention(i)} should appear exactly once with ${n} players`);
        }
        // only round 1 pairs two mentions; later rounds pair "Winner of Match N" placeholders
        assert.equal(matchPairs(out).length, n / 2,
            `a ${n}-player knockout opens with ${n / 2} matches`);
        assert.ok(groupLines(out).length === 0, `no groups expected with ${n} players`);
    }
});

test('3 and 5 players get a round robin where every pair meets exactly once', () => {
    for (const n of [3, 5]) {
        const out = makeTournament(input(n));
        const pairs = matchPairs(out);
        assert.equal(pairs.length, (n * (n - 1)) / 2,
            `${n}-player round robin has ${(n * (n - 1)) / 2} matches, got:\n${out}`);
        assert.equal(new Set(pairs).size, pairs.length, `repeated pairing with ${n} players`);
        assert.match(out, /tiebreaker/i, `round robin needs a tiebreaker rule with ${n} players`);
        assert.ok(groupLines(out).length === 0, `no groups expected with ${n} players`);
    }
});

test('non-power-of-2 counts from 6 up get a group stage feeding a knockout', () => {
    for (let n = 6; n <= 64; n++) {
        if (Number.isInteger(Math.log2(n))) continue;
        const out = makeTournament(input(n));
        const groups = groupLines(out);

        assert.ok(Number.isInteger(Math.log2(groups.length)) && groups.length >= 2,
            `group count ${groups.length} should be a power of 2 with ${n} players`);

        const sizes = groups.map(line => [...line.matchAll(/<@!?\d+>/g)].length);
        assert.ok(Math.max(...sizes) <= 5, `group of ${Math.max(...sizes)} with ${n} players`);
        assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1,
            `group sizes ${sizes} differ by more than 1 with ${n} players`);
        assert.equal(sizes.reduce((a, b) => a + b, 0), n,
            `groups should hold all ${n} players exactly once`);

        // smallest power-of-2 group count: half as many groups would overflow 5 per group
        assert.ok(Math.ceil(n / (groups.length / 2)) > 5,
            `${groups.length} groups is more than needed for ${n} players`);

        // each player sits in exactly one group and nowhere else
        for (let i = 0; i < n; i++) {
            assert.equal(countOccurrences(out, mention(i)), 1,
                `${mention(i)} should appear exactly once with ${n} players`);
        }

        assert.match(out, /tiebreaker/i, `group stage needs a tiebreaker rule with ${n} players`);
        assert.ok(out.includes('Winner of Group A vs Winner of Group B'),
            `knockout should start from group winners with ${n} players:\n${out}`);
        assert.match(out, /\*\*Final\*\*/, `bracket should end in a final with ${n} players`);
    }
});

test('spot-check group counts from the spec', () => {
    for (const [n, expected] of [[6, 2], [11, 4], [33, 8], [63, 16]]) {
        const out = makeTournament(input(n));
        assert.equal(groupLines(out).length, expected,
            `${n} players should make ${expected} groups`);
    }
});
