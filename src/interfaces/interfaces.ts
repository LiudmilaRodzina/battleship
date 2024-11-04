export interface User {
  name: string;
  password: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  type: string;
  size: number;
  position: Position[];
  direction: boolean;
  length: number;
}

export interface Player {
  name: string;
  id: string;
  ships: Ship[];
}

export interface Room {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
}
