import { addUser, validateUser, users } from './userDatabase';
export const activeUsers = new Map();
export function handleUserMessage(ws, message) {
    const request = JSON.parse(message);
    switch (request.type) {
        case 'reg':
            handleRegistration(ws, request);
            break;
        case 'login':
            handleLogin(ws, request);
            break;
        default:
            console.error(`Unknown request type: ${request.type}`);
    }
}
function handleRegistration(ws, request) {
    const { name, password } = JSON.parse(request.data);
    const userExists = users.has(name);
    if (userExists) {
        const isValid = validateUser(name, password);
        if (!isValid) {
            ws.send(JSON.stringify({
                type: 'reg',
                data: JSON.stringify({
                    name,
                    error: true,
                    errorText: 'User already exists with a different password',
                }),
                id: request.id,
            }));
            return;
        }
    }
    else {
        addUser(name, password);
        console.log(`${name} has registered successfully`);
    }
    activeUsers.set(ws, name);
    ws.send(JSON.stringify({
        type: 'updateInterface',
        status: 'loggedIn',
        name,
    }));
    ws.send(JSON.stringify({
        type: 'reg',
        data: JSON.stringify({
            name,
            error: false,
            errorText: '',
        }),
        id: request.id,
    }));
}
function handleLogin(ws, request) {
    const { name, password } = JSON.parse(request.data);
    const isValid = validateUser(name, password);
    if (isValid) {
        activeUsers.set(ws, name);
        ws.send(JSON.stringify({
            type: 'updateInterface',
            status: 'loggedIn',
            name,
        }));
    }
}
