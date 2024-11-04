import { WebSocket } from 'ws';
import { getRoom } from '../room/roomHandler';
import { activeUsers } from '../user/userHandler';
import { Player } from '../interfaces/interfaces';

export function handleShipsMessage(ws: WebSocket, message: string) {
  const request = JSON.parse(message);

  switch (request.type) {
    case 'add_ships':
      addShips(ws, request);
      break;
    default:
      console.error(`Unknown request type: ${request.type}`);
  }
}

function addShips(_: WebSocket, request: any) {
  const { gameId, ships, indexPlayer } = JSON.parse(request.data);
  const room = getRoom(gameId);

  if (!room) {
    console.error(`Room not found for gameId: ${gameId}`);
    return;
  }

  const playerIndex = room.players.findIndex(
    (player: Player) => player.id === indexPlayer
  );

  if (playerIndex === -1) {
    console.error(`Player not found in room: ${indexPlayer}`);
    return;
  }

  const player = room.players[playerIndex] as Player;
  player.ships = ships;

  const turnMessage = {
    type: 'turn',
    data: JSON.stringify({
      currentPlayer: room.players[0].id,
    }),
    id: 0,
  };

  room.players.forEach((player: Player) => {
    const wsPlayer = [...activeUsers.keys()].find(
      (key) => activeUsers.get(key) === player.name
    );
    if (wsPlayer) {
      wsPlayer.send(JSON.stringify(turnMessage));
    }
  });

  const allShipsPlaced = room.players.every(
    (player) => player.ships && player.ships.length > 0
  );
  if (allShipsPlaced) {
    startGame(room);
  }
}

function startGame(room: any) {
  room.players.forEach((player: Player) => {
    const startGameMessage = {
      type: 'start_game',
      data: JSON.stringify({
        ships: player.ships,
        currentPlayerIndex: player.id,
      }),
      id: 0,
    };

    const wsPlayer = [...activeUsers.keys()].find(
      (key) => activeUsers.get(key) === player.name
    );
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

  room.players.forEach((player: Player) => {
    const wsPlayer = [...activeUsers.keys()].find(
      (key) => activeUsers.get(key) === player.name
    );
    if (wsPlayer) {
      wsPlayer.send(JSON.stringify(turnMessage));
    }
  });
}
