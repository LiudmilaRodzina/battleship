import { WebSocketServer, WebSocket } from 'ws';
import { activeUsers, handleUserMessage } from '../user/userHandler';
import { handleRoomMessage } from '../room/roomHandler';
import { handleShipsMessage } from '../ships/shipsHandler';

const WS_PORT = process.env.WS_PORT || 3000;
const wsServer = new WebSocketServer({ port: Number(WS_PORT) });

wsServer.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: string) => {
    const request = JSON.parse(message);

    if (request.type === 'reg' || request.type === 'login') {
      handleUserMessage(ws, message);
    } else if (
      request.type === 'create_room' ||
      request.type === 'add_user_to_room'
    ) {
      handleRoomMessage(ws, message);
    } else if (request.type === 'add_ships') {
      handleShipsMessage(ws, message);
    } else {
    }
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
