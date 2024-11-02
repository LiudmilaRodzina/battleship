import { WebSocketServer, WebSocket } from 'ws';
import { handleUserMessage, activeUsers } from '../user/userHandler';

const WS_PORT = process.env.WS_PORT || 3000;
const wsServer = new WebSocketServer({ port: Number(WS_PORT) });

wsServer.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: string) => {
    handleUserMessage(ws, message);
  });

  ws.on('close', () => {
    const name = activeUsers.get(ws);
    if (name) {
      console.log(`${name} has disconnected`);
      activeUsers.delete(ws);
    }
  });
});

console.log(`WebSocket server started on ws://localhost:${WS_PORT}`);

export default wsServer;
