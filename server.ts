import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';

interface SyncDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  connectedAt: number;
  lastSync: number;
  status: 'online' | 'synced';
}

interface RoomState {
  roomId: string;
  items: unknown[];
  updatedAt: number;
  clients: Map<WebSocket, SyncDevice>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  const cleanId = roomId.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase() || 'DEFAULT';
  let room = rooms.get(cleanId);
  if (!room) {
    room = {
      roomId: cleanId,
      items: [],
      updatedAt: Date.now(),
      clients: new Map(),
    };
    rooms.set(cleanId, room);
  }
  return room;
}

function getRoomDevicesList(room: RoomState): SyncDevice[] {
  return Array.from(room.clients.values());
}

function broadcastToRoom(room: RoomState, payload: unknown, excludeWs?: WebSocket) {
  const serialized = JSON.stringify(payload);
  for (const [clientWs] of room.clients.entries()) {
    if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(serialized);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });

  app.get('/api/sync/:roomId', (req, res) => {
    const room = getOrCreateRoom(req.params.roomId);
    res.json({
      roomId: room.roomId,
      items: room.items,
      devices: getRoomDevicesList(room),
      updatedAt: room.updatedAt,
    });
  });

  app.post('/api/sync/:roomId', (req, res) => {
    const room = getOrCreateRoom(req.params.roomId);
    const { items, senderDeviceId } = req.body ?? {};
    if (Array.isArray(items)) {
      room.items = items;
      room.updatedAt = Date.now();
      for (const dev of room.clients.values()) {
        dev.lastSync = room.updatedAt;
      }
      broadcastToRoom(room, {
        type: 'sync:items',
        roomId: room.roomId,
        items: room.items,
        senderDeviceId: senderDeviceId || null,
        updatedAt: room.updatedAt,
      });
    }
    res.json({
      ok: true,
      roomId: room.roomId,
      count: room.items.length,
      devices: getRoomDevicesList(room),
    });
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    let joinedRoomId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'join' && typeof msg.roomId === 'string') {
          if (joinedRoomId) {
            const oldRoom = rooms.get(joinedRoomId);
            if (oldRoom) {
              oldRoom.clients.delete(ws);
              broadcastToRoom(oldRoom, {
                type: 'room:devices',
                roomId: oldRoom.roomId,
                devices: getRoomDevicesList(oldRoom),
              });
            }
          }

          const room = getOrCreateRoom(msg.roomId);
          joinedRoomId = room.roomId;

          const device: SyncDevice = {
            id: String(msg.deviceId || `dev_${Date.now()}`),
            name: String(msg.deviceName || (msg.deviceType === 'mobile' ? 'Mobile Phone' : 'Laptop / Desktop')),
            type: msg.deviceType === 'mobile' ? 'mobile' : msg.deviceType === 'tablet' ? 'tablet' : 'desktop',
            connectedAt: Date.now(),
            lastSync: Date.now(),
            status: 'synced',
          };

          // Seed room items only if room has no items yet and host is not joining as a peer
          if (!msg.isJoiningPeer && room.items.length === 0 && Array.isArray(msg.items) && msg.items.length > 0) {
            room.items = msg.items;
            room.updatedAt = Date.now();
          }

          room.clients.set(ws, device);

          // Send authoritative state back to newly joined client
          ws.send(
            JSON.stringify({
              type: 'room:state',
              roomId: room.roomId,
              items: room.items,
              devices: getRoomDevicesList(room),
              updatedAt: room.updatedAt,
            })
          );

          // Notify everyone in room about updated devices
          broadcastToRoom(
            room,
            {
              type: 'room:devices',
              roomId: room.roomId,
              devices: getRoomDevicesList(room),
              joinedDevice: device,
            },
            ws
          );
        } else if (msg.type === 'sync:items' && joinedRoomId && Array.isArray(msg.items)) {
          const room = rooms.get(joinedRoomId);
          if (!room) return;
          room.items = msg.items;
          room.updatedAt = Date.now();
          const sender = room.clients.get(ws);
          if (sender) {
            sender.lastSync = room.updatedAt;
          }
          broadcastToRoom(
            room,
            {
              type: 'sync:items',
              roomId: room.roomId,
              items: room.items,
              senderDeviceId: msg.senderDeviceId || sender?.id || null,
              updatedAt: room.updatedAt,
            },
            ws
          );
          broadcastToRoom(room, {
            type: 'room:devices',
            roomId: room.roomId,
            devices: getRoomDevicesList(room),
          });
        }
      } catch (err) {
        console.warn('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (!joinedRoomId) return;
      const room = rooms.get(joinedRoomId);
      if (!room) return;
      room.clients.delete(ws);
      broadcastToRoom(room, {
        type: 'room:devices',
        roomId: room.roomId,
        devices: getRoomDevicesList(room),
      });
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SyncSpace server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
