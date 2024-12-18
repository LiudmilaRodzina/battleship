import { activeUsers } from '../user/userHandler';
import { getRoom } from '../room/roomHandler';
export function handleGameMessage(ws, message) {
    const request = JSON.parse(message);
    switch (request.type) {
        case 'attack':
            handleAttack(ws, request);
            break;
        case 'randomAttack':
            handleRandomAttack(ws, request);
            break;
        case 'update_winners':
            updateWinner(ws, request);
            break;
        default:
            console.error(`Unknown request type: ${request.type}`);
    }
}
function handleAttack(_, request) {
    try {
        const { gameId, x, y, indexPlayer } = JSON.parse(request.data);
        const position = { x, y };
        const room = getRoom(gameId);
        if (!room) {
            console.error(`Room not found for gameId: ${gameId}`);
            return;
        }
        const currentPlayerIndex = room.players.findIndex((player) => player.id === indexPlayer);
        const currentPlayer = room.players[currentPlayerIndex];
        const targetPlayer = room.players[(currentPlayerIndex + 1) % 2];
        if (!currentPlayer || !targetPlayer) {
            console.error(`Player not found for indexPlayer: ${indexPlayer}`);
            return;
        }
        const isHit = checkHit(targetPlayer.ships, position);
        let status = isHit ? 'shot' : 'miss';
        broadcastAttackResult(room, position, status);
        if (checkAllShipsSunk(targetPlayer.ships)) {
            finishGame(room, currentPlayer.id);
            return;
        }
        if (status === 'miss') {
            room.currentPlayerIndex =
                (room.currentPlayerIndex + 1) % room.players.length;
        }
        broadcastTurn(room);
    }
    catch (error) {
        console.error('Failed to parse request data:', error);
    }
}
function checkHit(ships, position) {
    for (const ship of ships) {
        if (Array.isArray(ship.position)) {
            for (const pos of ship.position) {
                if (pos.x === position.x && pos.y === position.y) {
                    pos.hit = true;
                    return true;
                }
            }
        }
        else {
            console.error('Ship position is not an array:', ship.position);
        }
    }
    return false;
}
function broadcastAttackResult(room, position, status) {
    const currentPlayer = room.players[room.currentPlayerIndex];
    const targetPlayer = room.players[(room.currentPlayerIndex + 1) % 2];
    room.players.forEach((player) => {
        const wsPlayer = [...activeUsers.keys()].find((key) => activeUsers.get(key) === player.name);
        if (wsPlayer) {
            if (player.id === currentPlayer.id) {
                wsPlayer.send(JSON.stringify({
                    type: 'attack',
                    data: JSON.stringify({
                        position,
                        currentPlayer: player.id,
                        status,
                        view: 'enemy',
                    }),
                    id: 0,
                }));
            }
            else if (player.id === targetPlayer.id) {
                wsPlayer.send(JSON.stringify({
                    type: 'attack',
                    data: JSON.stringify({
                        position,
                        currentPlayer: currentPlayer.id,
                        status,
                        view: 'own',
                    }),
                    id: 0,
                }));
            }
        }
    });
}
function broadcastTurn(room) {
    const currentPlayer = room.players[room.currentPlayerIndex];
    room.players.forEach((player) => {
        const wsPlayer = [...activeUsers.keys()].find((key) => activeUsers.get(key) === player.name);
        if (wsPlayer) {
            wsPlayer.send(JSON.stringify({
                type: 'turn',
                data: JSON.stringify({ currentPlayer: currentPlayer.id }),
                id: 0,
            }));
        }
    });
}
function handleRandomAttack(ws, request) {
    try {
        const { gameId, indexPlayer } = JSON.parse(request.data);
        const room = getRoom(gameId);
        if (!room) {
            console.error(`Room not found for gameId: ${gameId}`);
            return;
        }
        const currentPlayer = room.players.find((player) => player.id === indexPlayer);
        if (!currentPlayer) {
            console.error(`Player not found for indexPlayer: ${indexPlayer}`);
            return;
        }
        const position = getRandomPosition();
        const targetPlayer = room.players.find((player) => player.id !== indexPlayer);
        if (!targetPlayer) {
            console.error(`Target player not found`);
            return;
        }
        const isHit = checkHit(targetPlayer.ships, position);
        let status = isHit ? 'shot' : 'miss';
        broadcastAttackResult(room, position, status);
        if (checkAllShipsSunk(targetPlayer.ships)) {
            finishGame(room, currentPlayer.id);
            return;
        }
        if (status === 'miss') {
            room.currentPlayerIndex =
                (room.currentPlayerIndex + 1) % room.players.length;
        }
        broadcastTurn(room);
    }
    catch (error) {
        console.error('Failed to handle random attack:', error);
    }
}
function getRandomPosition() {
    return {
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
    };
}
function updateWinner(_, request) {
    const { gameId, winnerId } = JSON.parse(request.data);
    const room = getRoom(gameId);
    if (!room) {
        console.error(`Room not found for gameId: ${gameId}`);
        return;
    }
    room.players.forEach((player) => {
        const wsPlayer = [...activeUsers.keys()].find((key) => activeUsers.get(key) === player.name);
        if (wsPlayer) {
            wsPlayer.send(JSON.stringify({
                type: 'winner_update',
                data: JSON.stringify({ winnerId }),
                id: request.id,
            }));
        }
    });
}
function checkAllShipsSunk(ships) {
    return ships.every((ship) => ship.position.every((pos) => pos.hit));
}
function finishGame(room, winnerId) {
    room.players.forEach((player) => {
        const wsPlayer = [...activeUsers.keys()].find((key) => activeUsers.get(key) === player.name);
        if (wsPlayer) {
            wsPlayer.send(JSON.stringify({
                type: 'finish',
                data: JSON.stringify({ winPlayer: winnerId }),
                id: 0,
            }));
        }
    });
}
