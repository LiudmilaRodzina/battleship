const users = new Map();
export function addUser(name, password) {
    if (users.has(name))
        return false;
    users.set(name, { name, password });
    return true;
}
export function validateUser(name, password) {
    const user = users.get(name);
    return user !== undefined && user.password === password;
}
export { users };
