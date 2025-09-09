// Temporary auth setup for development
// In production, this would be handled by a proper login flow

export const setupTestAuth = () => {
  // This is the JWT token from our test user registration
  const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWZieWE1c3UwMDAwdWw4eWJ2Nm1vOG1yIiwiaWF0IjoxNzU3Mzg2MDU0fQ.PuhuaL1_uIO1SowoCOm6ROiu-PcXvniUKWYJMjrZHeA";
  
  // Set the token in localStorage so the API client can use it
  localStorage.setItem('authToken', testToken);
  
  console.log('✅ Test authentication token set up successfully');
  console.log('🔑 Token:', testToken.substring(0, 50) + '...');
  console.log('👤 Test user: test@example.com');
};

export const clearAuth = () => {
  localStorage.removeItem('authToken');
  console.log('🚪 Authentication cleared');
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};