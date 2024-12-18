import { getRoom } from '../room/roomHandler';
import { activeUsers } from '../user/userHandler';
export function handleShipsMessage(ws, message) {
    const request = JSON.parse(message);
    switch (request.type) {
        case 'add_ships':
            addShips(ws, request);
            break;
        default:
            console.error(`Unknown request type: ${request.type}`);
    }
}
function addShips(ws, request) {
    const { gameId, ships, indexPlayer } = JSON.parse(request.data);
    const room = getRoom(gameId);
    if (!room) {
        console.error(`Room not found for gameId: ${gameId}`);
        return;
    }
    const playerIndex = room.players.findIndex((player) => player.id === indexPlayer);
    if (playerIndex === -1) {
        console.error(`Player not found in room: ${indexPlayer}`);
        return;
    }
    const player = room.players[playerIndex];
    player.ships = ships.map((ship) => {
        const positions = Array(ship.length)
            .fill(null)
            .map((_, i) => {
            return ship.direction
                ? { x: ship.position.x, y: ship.position.y + i }
                : { x: ship.position.x + i, y: ship.position.y };
        });
        return { ...ship, position: positions };
    });
    const turnMessage = {
        type: 'turn',
        data: JSON.stringify({
            currentPlayer: room.players[0].id,
        }),
        id: 0,
    };
    room.players.forEach((player) => {
        const wsPlayer = [...activeUsers.keys()].find((key) => activeUsers.get(key) === player.name);
        if (wsPlayer) {
            wsPlayer.send(JSON.stringify(turnMessage));
        }
    });
    const allShipsPlaced = room.players.every((player) => player.ships && player.ships.length > 0);
    if (allShipsPlaced) {
        startGame(room);
    }
}
function startGame(room) {
    room.players.forEach((player) => {
        const shipsData = player.ships.map((ship) => ({
            length: ship.length,
            direction: ship.direction,
            position: ship.position.map((pos) => ({ x: pos.x, y: pos.y })),
        }));
        const startGameMessage = {
            type: 'start_game',
            data: JSON.stringify({
                ships: shipsData,
                currentPlayerIndex: player.id,
            }),
            id: 0,
        };
        const wsPlayer = [...activeUsers.keys()].find((key) => activeUsers.get(key) === player.name);
        if (wsPlayer) {
            wsPlayer.send(JSON.stringify(startGameMessage));
        }
    });
    const turnMessage = {
        type: 'turn',
        data: JSON.stringify({
            currentPlayer: room.players[0].id,
        }),
        id: 0,
    };
    room.players.forEach((player) => {
        const wsPlayer = [...activeUsers.keys()].find((key) => activeUsers.get(key) === player.name);
        if (wsPlayer) {
            wsPlayer.send(JSON.stringify(turnMessage));
        }
    });
}
