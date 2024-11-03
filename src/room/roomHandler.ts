import { WebSocket } from 'ws';
import { activeUsers } from '../user/userHandler';

interface Room {
  roomId: string;
  players: Array<{ name: string; id: string }>;
}

const rooms: Map<string, Room> = new Map();

export function handleRoomMessage(ws: WebSocket, message: string) {
  const request = JSON.parse(message);

  switch (request.type) {
    case 'create_room':
      handleCreateRoom(ws, request);
      break;
    case 'add_user_to_room':
      handleJoinRoom(ws, request);
      break;
    default:
      console.error(`Unknown request type: ${request.type}`);
  }
}

function handleCreateRoom(ws: WebSocket, request: any) {
  const roomId = generateUniqueId();
  const playerName = activeUsers.get(ws);

  if (!playerName) {
    return;
  }

  const room: Room = {
    roomId,
    players: [{ name: playerName, id: generateUniqueId() }],
  };
  rooms.set(roomId, room);

  ws.send(
    JSON.stringify({
      type: 'roomCreated',
      data: JSON.stringify({ roomId, players: room.players }),
      id: request.id,
    })
  );
  broadcastRoomList();
}

function handleJoinRoom(ws: WebSocket, request: any) {
  const { indexRoom } = JSON.parse(request.data);
  const playerName = activeUsers.get(ws);

  if (!playerName) {
    return;
  }

  const room = rooms.get(indexRoom);
  if (!room) {
    return;
  }

  if (room.players.length === 2) {
    return;
  }

  room.players.push({ name: playerName, id: generateUniqueId() });

  room.players.forEach((player) => {
    const wsPlayer = [...activeUsers.keys()].find(
      (key) => activeUsers.get(key) === player.name
    );

    if (wsPlayer) {
      wsPlayer.send(
        JSON.stringify({
          type: 'create_game',
          data: JSON.stringify({
            idGame: room.roomId,
            idPlayer: player.id,
          }),
          id: 0,
        })
      );
    }
  });

  rooms.delete(indexRoom);
  broadcastRoomList();
}

function broadcastRoomList() {
  const roomList = Array.from(rooms.entries())
    .map(([roomId, room]) => ({
      roomId,
      roomUsers: room.players.map((player) => ({
        name: player.name,
        index: player.id,
      })),
    }))
    .filter((room) => room.roomUsers.length === 1);

  const updateRoomMessage = JSON.stringify({
    type: 'update_room',
    data: JSON.stringify(roomList),
    id: 0,
  });

  activeUsers.forEach((_, userSocket) => {
    userSocket.send(updateRoomMessage);
  });
}

function generateUniqueId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getRoom(roomId: string) {
  return rooms.get(roomId);
}

export function removeRoom(roomId: string) {
  rooms.delete(roomId);
}