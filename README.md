# Discord Bot

Discord bot made for random commands.

## Commands

| Command | What it does |
|---|---|
| `/test` | Basic sanity-check command |
| `/coinflip` | Opens a modal to pick between 2–5 options, picks a winner |
| `/sacrifice` | Picks X random people from a comma-separated list |
| `/save_idea` | Saves an idea name + description to MySQL |
| `/fetch_idea` | Fetch an idea's description by name *(not implemented yet)* |
| `/all_ideas` | List all saved idea names *(not implemented yet)* |
| `/tournament` | Builds a random, bye-free tournament from mentioned players: knockout for power-of-2 counts, round robin for 3 or 5, group stage → knockout otherwise |

There is also a **flamer** that watches specific users via the Discord gateway and replies to their messages using a local LLM through Ollama.

## Prerequisites

- **Node.js 18+**
- **MySQL** running locally (the bot connects as `root` on `localhost`)
- **Ollama** running locally, with the model you want pulled (e.g. `ollama pull llama3.2`)
- **ngrok** (or another tunnel) so Discord can reach your local server
- A Discord application from the [Discord Developer Portal](https://discord.com/developers/applications) with a bot added to your server

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the `.env` file

Create a `.env` in the project root:

```env
APP_ID=<your application ID>
DISCORD_TOKEN=<your bot token>
PUBLIC_KEY=<your application public key>
GUILD_ID=<your server ID>
MYSQL_PASS=<your MySQL root password>
FLAME_TARGET_IDS=<comma-separated Discord user IDs the flamer targets>
OLLAMA_MODEL=<ollama model name, defaults to llama3.2>
```

`APP_ID`, `DISCORD_TOKEN`, and `PUBLIC_KEY` all come from your app's page in the Developer Portal.

### 3. Create the MySQL database

The bot expects a database named `ideas` with an `ideas` table:

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ideas;
  CREATE TABLE IF NOT EXISTS ideas.ideas (name VARCHAR(255), description VARCHAR(255));"
```

Without this, the bot still starts but logs `MySQL error: Unknown database 'ideas'` and `/save_idea` won't work.

### 4. Register the slash commands

```bash
npm run register
```

> **Note:** this script registers the commands successfully but never exits on its own (the MySQL connection holds the process open). Once it's been running a few seconds, Ctrl+C it — the commands are registered.

You only need to re-run this when you add or change command definitions in `commands.js`.

### 5. Start the bot

```bash
npm start        # or: npm run dev (auto-restarts on file changes)
```

You should see:

```
Listening on port 3000
Flamer ready — watching N user(s)
```

### 6. Expose the interactions endpoint

Discord delivers slash commands over HTTP, so your local server needs a public URL:

```bash
ngrok http 3000
```

Copy the `https://...ngrok-free.dev` URL, then in the Developer Portal go to **your app → General Information → Interactions Endpoint URL** and set it to:

```
https://<your-ngrok-url>/interactions
```

Discord sends a verification PING when you save — the bot must be running for this to succeed.

> On the free ngrok tier the URL changes every restart, so you'll need to update the portal each time. Claim a free static domain on ngrok to avoid this.

The flamer doesn't need the tunnel — it connects out to the Discord gateway directly.

### 7. Try it

Type `/test` in your server. If the bot replies, you're good to go.

## Troubleshooting

- **`MySQL error: Unknown database 'ideas'` on startup** — do step 3.
- **Slash commands time out ("application did not respond")** — the bot isn't running, the ngrok tunnel is down, or the Interactions Endpoint URL in the portal is stale.
- **Flamer doesn't reply** — make sure Ollama is running (`ollama serve`) and the model in `OLLAMA_MODEL` is pulled.
