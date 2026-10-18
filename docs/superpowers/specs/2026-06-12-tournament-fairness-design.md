# Tournament Fairness Design

**Date:** 2026-06-12
**Goal:** `/tournament` must never auto-advance anyone (no byes), at any player count.

## Behavior by player count

| Players | Format |
|---|---|
| < 2 | Error message (unchanged) |
| 2, 4, 8, 16, 32, 64 | Knockout bracket (unchanged — zero byes at these sizes) |
| 3, 5 | Single round robin, scheduled in rounds via the circle method. Most wins is champion; tie → tiebreaker match. |
| 6–64, not a power of 2 | Group stage → knockout (see below) |
| > 64 | Error message (unchanged) |

## Group stage rules

1. Players are Fisher-Yates shuffled (existing behavior), then dealt into the
   **smallest power-of-2 number of groups such that every group has ≤ 5 players**
   (6 → 2 groups, 11 → 4, 33 → 8, 63 → 16). Group sizes differ by at most 1.
2. Each group is a round robin — most wins advances; tie for first → tiebreaker
   match. Groups are listed as members only (pairings are self-evident), keeping
   the message compact at any size.
3. Group winners enter a knockout bracket. Because the group count is a power
   of 2, the bracket needs no byes by construction.

A group of 2 can occur (e.g. 11 players → 3, 3, 3, 2); it is a single
head-to-head match, which is a real match, not a bye.

## Round robin scheduling (3 or 5 players)

Circle method: fix one player, rotate the rest each round. Odd counts get a
null slot — the player paired with it rests that round (they still play every
opponent exactly once; resting is not advancement).

## Non-goals

- The bot does not track results; it prints the schedule with "Winner of …"
  placeholders, same as today.
- No changes to `commands.js` or `app.js`; everything lives in `makeTournament`
  and helpers in `utils.js`.

## Verification

Smoke script calls `makeTournament` for counts 1–65 (including 3, 5, 6, 11, 33,
63, 64) asserting: no "BYE" text ever appears, every player appears exactly
once, group sizes ≤ 5, and output stays under Discord's 4000-char limit.
