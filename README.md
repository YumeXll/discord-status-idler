# Discord Status Idler

A lightweight, standalone Node.js script that keeps your personal Discord account status permanently "Online" (24/7) by maintaining a WebSocket connection to the Discord Gateway.

## Features

✅ **Secure Token Storage** – Discord token stored in `.env` file (not hardcoded)  
✅ **Automatic Reconnection** – Auto-reconnects if internet drops or Discord disconnects  
✅ **Discord Gateway Protocol** – Proper implementation of Opcode 10 (Hello), Opcode 1 (Heartbeat), and Opcode 2 (Identify)  
✅ **Graceful Shutdown** – Press Ctrl+C to safely close the connection  
✅ **Minimal Logging** – Informative logs for debugging without spam  

## Prerequisites

- Node.js v14 or later ([Download](https://nodejs.org/))
- Your Discord personal token (see **Getting Your Discord Token** below)
- VS Code (optional, but this guide assumes you're using it)

## Installation & Setup

### 1. Clone or Download the Project

If you haven't already, clone this repository or extract it to your desired location.

### 2. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This installs `ws` (WebSocket library) and `dotenv` (environment variable loader).

### 3. Get Your Discord Token

**⚠️ SECURITY WARNING: Your Discord token is like a password. Never share it with anyone, and never commit it to version control.**

To get your Discord token:

1. Open Discord in your web browser (https://discord.com/app)
2. Open **Developer Tools** (Press `F12`)
3. Go to the **Network** tab
4. Open the **Console** tab
5. Paste the following command and press Enter:
   ```javascript
   (webpackChunkdiscord_app=window.webpackChunkdiscord_app||[]).push([["lastBuild"],{},e=>{Object.entries(e.c).find(([e,{exports:{default:{getToken:e}}}])=>e).exports.default.getToken()}]);
   ```
6. Your token will appear in the console output
7. Copy it

**Alternative method (if above doesn't work or for Firefox-based browsers like Waterfox):**
1. Open Discord in your web browser (e.g., Waterfox: https://discord.com/app)
2. Open **Developer Tools** (Press `F12` or `Ctrl+Shift+I` / `Cmd+Option+I`)
3. Go to the **Storage** tab
4. In the left sidebar, expand "Local Storage" and then select `https://discord.com`
5. In the filter box (usually at the top of the Storage tab), type `token`
6. Look for an entry with the key `token`. The value associated with this key (it will start with `mfa.`, `NzY...`, or similar) is your Discord token.
7. Copy the entire value.

**Another alternative for any browser (less direct):**
1. In the Network tab, look for any request to Discord (e.g., to `https://discord.com/api/v10/users/@me`)
2. Click on the request, go to **Request Headers**
3. Find the `Authorization` header – that's your token

### 4. Configure Your Token

1. Open the `.env` file in the project root
2. Replace `your_token_here` with your actual Discord token:
   ```
   DISCORD_TOKEN=your_actual_token_here
   ```
3. Save the file

**Note:** The `.env` file is in `.gitignore`, so it won't be accidentally committed to version control.

## Running the Script

### Option 1: Terminal in VS Code

1. Open VS Code and open the project folder: `File → Open Folder` → Select `discord-status-idler`
2. Open a terminal: `Ctrl + ` (backtick)
3. Run the script:
   ```bash
   node index.js
   ```
4. You should see output like:
   ```
   🔗 Connecting to Discord Gateway...
   ✅ Connected to Discord Gateway
   💓 Hello event received. Heartbeat interval: 41250ms
   🔐 Sending Identify payload...
   💓 Heartbeat sent
   🎮 Ready event received. User: YourUsername#0000
   ✅ Heartbeat started
   💓 Heartbeat ACK received
   ```

### Option 2: Terminal (Command Line)

```bash
cd path/to/discord-status-idler
node index.js
```

## Verification

1. **Check your Discord status:**
   - Open Discord (desktop, web, or mobile)
   - Your account status should show as "🟢 Online"
   - It should remain online as long as the script is running

2. **Monitor the script logs:**
   - You'll see heartbeat confirmations every ~41 seconds (the interval sent by Discord)
   - If the connection drops, you'll see a reconnection message

## Stopping the Script

Press `Ctrl + C` in the terminal to gracefully shut down the script. It will close the WebSocket connection cleanly.

## How It Works

1. **Connect** – Establishes a WebSocket connection to Discord's Gateway
2. **Hello** – Receives heartbeat interval from Discord
3. **Identify** – Sends your token and presence status to Discord
4. **Heartbeat** – Periodically sends heartbeats to keep the connection alive
5. **Reconnect** – If connection drops, automatically reconnects after 5 seconds

## Troubleshooting

### Error: `DISCORD_TOKEN not found in .env file`

- Make sure the `.env` file exists in the project root
- Verify the file contains: `DISCORD_TOKEN=your_token`
- Restart the script

### Error: `Invalid token` or `Authentication failed`

- Your token may have expired or is invalid
- Get a new token following the steps in **Getting Your Discord Token**
- Update the `.env` file and restart

### Script connects but status doesn't change to Online

- Close Discord completely (all windows/tabs) and reopen it
- The status may take a few seconds to update

### Script keeps reconnecting (Opcode 4000 error)

- Your token is likely invalid or revoked
- Discord may have revoked your token for security reasons
- Get a fresh token and try again

### High CPU/Memory Usage

- This shouldn't happen – the script is lightweight
- Check if you're running multiple instances by mistake
- Restart the script

## Advanced Options

### Custom Presence (Game/Status)

You can add a custom game or status by modifying the `presence` object in the `sendIdentify()` function:

```javascript
presence: {
  status: 'online',
  activities: [
    {
      name: 'Custom Status Here',
      type: 0, // PLAYING
    }
  ],
  afk: false,
}
```

### Change Heartbeat Logging

In the `startHeartbeat()` function, comment out or remove the line:
```javascript
console.log('💓 Heartbeat sent');
```

To reduce log spam.

## Disclaimer

⚠️ **Use at your own risk.** This script uses your personal Discord account token. Discord's Terms of Service prohibit automating personal accounts. While this script is unlikely to get you banned (it's minimal and doesn't violate any ToS), **use it responsibly**. Do not:

- Use it for spam or harassment
- Sell or share access to your account
- Combine it with other forms of account automation

## License

MIT
