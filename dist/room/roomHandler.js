import { activeUsers } from '../user/userHandler';
import { generateUniqueId } from '../utils/helpers';
export const rooms = new Map();
export function handleRoomMessage(ws, message) {
    const request = JSON.parse(message);
    switch (request.type) {
        case 'create_room':
            createRoom(ws, request);
            break;
        case 'add_user_to_room':
            joinRoom(ws, request);
            break;
        default:
            console.error(`Unknown request type: ${request.type}`);
    }
}
function createRoom(ws, request) {
    const roomId = generateUniqueId();
    const playerName = activeUsers.get(ws);
    if (!playerName) {
        return;
    }
    const room = {
        roomId,
        players: [{ name: playerName, id: generateUniqueId(), ships: [] }],
        currentPlayerIndex: 0,
    };
    rooms.set(roomId, room);
    ws.send(JSON.stringify({
        type: 'roomCreated',
        data: JSON.stringify({ roomId, players: room.players }),
        id: request.id,
    }));
    broadcastRoomList();
}
function joinRoom(ws, request) {
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
    room.players.push({ name: playerName, id: generateUniqueId(), ships: [] });
    room.players.forEach((player) => {
        const wsPlayer = [...activeUsers.keys()].find((key) => activeUsers.get(key) === player.name);
        if (wsPlayer) {
            wsPlayer.send(JSON.stringify({
                type: 'create_game',
                data: JSON.stringify({ idGame: room.roomId, idPlayer: player.id }),
                id: 0,
            }));
        }
    });
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
export function getRoom(roomId) {
    return rooms.get(roomId);
}
