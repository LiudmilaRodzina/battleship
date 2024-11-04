export interface User {
  name: string;
  password: string;
}

interface Position {
  x: number;
  y: number;
}

interface Ship {
  type: string;
  size: number;
  position: Position[];
}

export interface Player {
  name: string;
  id: string;
  ships: Ship[];
}

export interface Room {
  roomId: string;
  players: Player[];
}
