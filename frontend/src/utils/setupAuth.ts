// Temporary auth setup for development
// In production, this would be handled by a proper login flow

export const setupTestAuth = () => {
  // JWT token for test-user-id with correct JWT secret
  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE3NTgxMTM4ODl9._qwCX3ZXu7IEDxDMvRiWplFU9V8w4gV41KiPIG828t4";

  // Set the token in localStorage so the API client can use it
  localStorage.setItem('authToken', testToken);
};

export const clearAuth = () => {
  localStorage.removeItem('authToken');
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};