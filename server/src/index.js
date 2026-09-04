import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { register } from './handlers.js';
import { startSweeper, stats } from './rooms.js';

const PORT = Number(process.env.PORT) || 8787;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
const httpServer = createServer(app);

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()), ...stats() });
});

const io = new Server(httpServer, {
  transports: ['websocket'],
  pingInterval: 10000,
  pingTimeout: 5000,
  cors: { origin: CORS_ORIGIN },
});

io.on('connection', (socket) => {
  register(io, socket);
});

startSweeper();

httpServer.listen(PORT, () => {
  console.log(`[dualcontrol] listening on :${PORT} (cors: ${CORS_ORIGIN})`);
});
