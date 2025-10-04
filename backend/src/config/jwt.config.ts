export interface JWTConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
}

export const jwtConfig: JWTConfig = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

// Validate JWT configuration
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this') {
  console.warn('⚠️  WARNING: Using default JWT_SECRET. Please set a secure JWT_SECRET in .env file');
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'your-super-secret-refresh-key-change-this') {
  console.warn('⚠️  WARNING: Using default JWT_REFRESH_SECRET. Please set a secure JWT_REFRESH_SECRET in .env file');
}
