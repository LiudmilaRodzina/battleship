import { WebSocket } from 'ws';
import { addUser, validateUser, users } from './userDatabase';

export const activeUsers = new Map<WebSocket, string>();

export function handleUserMessage(ws: WebSocket, message: string) {
  try {
    const request = JSON.parse(message);
    if (request.type === 'reg') {
      const { name, password } = JSON.parse(request.data);

      const userExists = users.has(name);
      if (userExists) {
        const isValid = validateUser(name, password);
        if (isValid) {
          console.log(`${name} already exists, proceeding to login`);
        } else {
          ws.send(
            JSON.stringify({
              type: 'reg',
              data: JSON.stringify({
                name,
                error: true,
                errorText: 'User already exists with a different password',
              }),
              id: request.id,
            })
          );
          return;
        }
      } else {
        addUser(name, password);
        console.log(`${name} has registered successfully`);
      }

      activeUsers.set(ws, name);

      ws.send(
        JSON.stringify({
          type: 'updateInterface',
          status: 'loggedIn',
          name,
        })
      );

      ws.send(
        JSON.stringify({
          type: 'reg',
          data: JSON.stringify({
            name,
            error: false,
            errorText: '',
          }),
          id: request.id,
        })
      );
    } else if (request.type === 'login') {
      const { name, password } = JSON.parse(request.data);

      const isValid = validateUser(name, password);
      if (isValid) {
        activeUsers.set(ws, name);

        ws.send(
          JSON.stringify({
            type: 'updateInterface',
            status: 'loggedIn',
            name,
          })
        );
      }
    }
  } catch (error) {
    console.error('Error parsing message:', error);
    ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
  }
}
