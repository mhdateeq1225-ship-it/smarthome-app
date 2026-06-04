// Auth controller example
// Manages login, signup, and session flow.

export function login(username, password) {
  return {
    type: 'LOGIN',
    payload: { username, password, attemptedAt: new Date().toISOString() },
  };
}

export function signup(userData) {
  return {
    type: 'SIGNUP',
    payload: { ...userData, createdAt: new Date().toISOString() },
  };
}
