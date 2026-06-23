const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Simple endpoint for our future keep-alive pinger
app.get('/health', (req, res) => {
    res.status(200).send('Script is alive!');
});

app.listen(PORT, () => {
    console.log(`Keep-alive server listening on port ${PORT}`);
});

require('dotenv').config();
const WebSocket = require('ws');

// Load Discord token from environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_TOKEN || DISCORD_TOKEN === 'your_token_here') {
  console.error('❌ Error: DISCORD_TOKEN not found in .env file or still set to placeholder.');
  console.error('Please add your Discord token to the .env file and try again.');
  process.exit(1);
}

// Discord Gateway constants
const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const OPCODES = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  RESUME: 6,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
};

let ws = null;
let heartbeatInterval = null;
let lastSequence = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Connect to Discord Gateway
 */
function connect() {
  console.log('🔗 Connecting to Discord Gateway...');
  
  ws = new WebSocket(GATEWAY_URL);

  ws.on('open', () => {
    console.log('✅ Connected to Discord Gateway');
    reconnectAttempts = 0;
  });

  ws.on('message', (data) => {
    try {
      const payload = JSON.parse(data);
      handlePayload(payload);
    } catch (error) {
      console.error('❌ Failed to parse message:', error);
    }
  });

  let initialHeartbeatTimeout = null;
  let heartbeatInterval = null;

  ws.on('close', (code, reason) => {
  console.log(`⚠️ Connection closed. Code: ${code}, Reason: ${reason || 'No reason'}`);
  
   // Clear both timers safely
   if (initialHeartbeatTimeout) {
     clearTimeout(initialHeartbeatTimeout);
     initialHeartbeatTimeout = null;
  }
   if (heartbeatInterval) {
     clearInterval(heartbeatInterval);
     heartbeatInterval = null;
  }

    attemptReconnect();
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });
}

/**
 * Handle incoming Gateway payload
 */
function handlePayload(payload) {
  const { op, d, s, t } = payload;

  // Update sequence number if provided
  if (s) {
    lastSequence = s;
  }

  switch (op) {
    case OPCODES.HELLO:
      handleHello(d);
      break;
    case OPCODES.HEARTBEAT_ACK:
      console.log('💓 Heartbeat ACK received');
      break;
    case OPCODES.DISPATCH:
      handleDispatch(t, d);
      break;
    default:
      break;
  }
}

/**
 * Handle Hello event (Opcode 10)
 * Contains heartbeat_interval and tells us to identify
 */
function handleHello(data) {
  const { heartbeat_interval } = data;
  console.log(`💓 Hello event received. Heartbeat interval: ${heartbeat_interval}ms`);

  // Send Identify payload
  sendIdentify();

  // Start sending heartbeats
  startHeartbeat(heartbeat_interval);
}

/**
 * Send Identify payload (Opcode 2)
 */
function sendIdentify() {
  const identifyPayload = {
    op: OPCODES.IDENTIFY,
    d: {
      token: DISCORD_TOKEN,
      intents: 0, // No intents needed for status-only bot
      properties: {
        os: 'linux',
        browser: 'Discord.js-like',
        device: 'Discord.js-like',
      },
      presence: {
        status: 'online',
        activities: [],
        afk: false,
      },
    },
  };

  console.log('🔐 Sending Identify payload...');
  send(identifyPayload);
}

/**
 * Start heartbeat interval
 */
function startHeartbeat(interval) {
  // Calculate a random jitter for the first heartbeat
  const initialDelay = Math.floor(interval * Math.random());
  console.log(`⏱️ First heartbeat scheduled in ${initialDelay}ms (jitter)`);

  setTimeout(() => {
    // Send the first heartbeat
    if (ws && ws.readyState === WebSocket.OPEN) {
      send({
        op: OPCODES.HEARTBEAT,
        d: lastSequence,
      });
      console.log('💓 Initial Heartbeat sent');
    }

    // Now start the regular, steady interval
    heartbeatInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        send({
          op: OPCODES.HEARTBEAT,
          d: lastSequence,
        });
        console.log('💓 Heartbeat sent');
      }
    }, interval);

  }, initialDelay);

  console.log('✅ Heartbeat sequence initialized');
}

/**
 * Handle Dispatch events (Opcode 0)
 */
function handleDispatch(eventType, data) {
  switch (eventType) {
    case 'READY':
      console.log(`🎮 Ready event received. User: ${data.user.username}#${data.user.discriminator}`);
      break;
    case 'RESUMED':
      console.log('🔄 Session resumed');
      break;
    default:
      // Ignore other events for now
      break;
  }
}

/**
 * Send payload to Gateway
 */
function send(payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  } else {
    console.warn('⚠️  WebSocket not open, cannot send payload');
  }
}

/**
 * Attempt to reconnect
 */
function attemptReconnect() {
  reconnectAttempts++;

  if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
    console.error(`❌ Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts. Giving up.`);
    process.exit(1);
  }

  const delay = 5000; // 5 seconds
  console.log(`🔄 Reconnecting in ${delay / 1000} seconds... (Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

  setTimeout(() => {
    connect();
  }, delay);
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down gracefully...');

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  if (ws) {
    ws.close(1000, 'User shutdown');
  }

  console.log('✅ Shutdown complete');
  process.exit(0);
});

// Start the connection
connect();
