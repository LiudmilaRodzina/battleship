interface User {
  name: string;
  password: string;
}

const users = new Map<string, User>();

export function addUser(name: string, password: string): boolean {
  if (users.has(name)) return false;
  users.set(name, { name, password });
  return true;
}

export function validateUser(name: string, password: string): boolean {
  const user = users.get(name);
  return user !== undefined && user.password === password;
}

export { users };
