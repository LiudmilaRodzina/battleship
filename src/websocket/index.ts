import { WebSocketServer, WebSocket } from 'ws';
import { activeUsers, handleUserMessage } from '../user/userHandler';
import { handleRoomMessage } from '../room/roomHandler';
import { handleShipsMessage } from '../ships/shipsHandler';
import { handleGameMessage } from '../game/gameHandler';

const WS_PORT = process.env.WS_PORT || 3000;
const wsServer = new WebSocketServer({ port: Number(WS_PORT) });

wsServer.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: string) => {
    const request = JSON.parse(message);

    switch (request.type) {
      case 'reg':
      case 'login':
        handleUserMessage(ws, message);
        break;
      case 'create_room':
      case 'add_user_to_room':
        handleRoomMessage(ws, message);
        break;
      case 'add_ships':
        handleShipsMessage(ws, message);
        break;
      case 'attack':
      case 'randomAttack':
      case 'update_winner':
      case 'finish_game':
        handleGameMessage(ws, message);
        break;
      default:
      // console.error(`Unknown request type: ${request.type}`);
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
