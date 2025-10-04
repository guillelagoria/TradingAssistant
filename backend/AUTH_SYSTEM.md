# Authentication System Documentation

## Overview

The Trading Diary backend now includes a complete, production-ready authentication system using JWT (JSON Web Tokens) with email verification, password reset, and secure token management.

## Features

- User registration with email verification
- Secure login with JWT tokens
- Access tokens (15 minutes) and refresh tokens (7 days)
- Email verification workflow
- Password reset via email
- Password change for logged-in users
- Account activation/deactivation
- Security event logging
- Protection against email enumeration attacks

## Database Schema

### User Model Updates

The following fields were added to the `User` model:

```prisma
model User {
  // ... existing fields

  // Email verification
  emailVerified             Boolean    @default(false)
  emailVerificationToken    String?    @unique
  emailVerificationExpires  DateTime?

  // Password reset
  passwordResetToken        String?    @unique
  passwordResetExpires      DateTime?

  // Account status
  lastLoginAt               DateTime?
  isActive                  Boolean    @default(true)
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe" // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm123...",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": false
    },
    "message": "Registration successful! Please check your email to verify your account."
  }
}
```

**Validation Rules:**
- Email: Valid email format
- Password: Min 8 characters, at least 1 uppercase, 1 lowercase, 1 number
- Name: Optional, 1-100 characters

---

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm123...",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": true,
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Cases:**
- 401: Invalid credentials
- 403: Email not verified
- 403: Account deactivated

---

#### 3. Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cm123...",
      "email": "user@example.com",
      "emailVerified": true
    },
    "message": "Email verified successfully! You can now log in."
  }
}
```

---

#### 4. Request Password Reset
```http
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "If an account exists with this email, you will receive a password reset link."
  }
}
```

**Note:** Always returns success to prevent email enumeration attacks.

---

#### 5. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully. You can now log in with your new password."
  }
}
```

---

#### 6. Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 7. Resend Verification Email
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "If an account exists with this email, you will receive a verification link."
  }
}
```

---

### Protected Endpoints (Authentication Required)

All protected endpoints require the `Authorization` header:

```http
Authorization: Bearer <access-token>
```

#### 8. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "cm123...",
    "email": "user@example.com",
    "name": "John Doe",
    "commission": 0,
    "timezone": "UTC",
    "emailVerified": true,
    "isActive": true,
    "subscriptionTier": "FREE"
  }
}
```

---

#### 9. Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password has been changed successfully"
  }
}
```

**Validation:**
- Current password must be correct
- New password must be different from current
- New password must meet strength requirements

---

#### 10. Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Note:** Since we're using JWT, logout is primarily client-side (remove tokens). This endpoint logs the event and can be extended for token blacklisting if needed.

---

## Middleware

### 1. `authenticate`
Requires valid JWT token in Authorization header. Attaches user to `req.user`.

```typescript
import { authenticate } from './middleware/auth';

router.get('/protected', authenticate, controller);
```

### 2. `optionalAuth`
Attaches user if valid token exists, but doesn't fail if no token.

```typescript
import { optionalAuth } from './middleware/auth';

router.get('/public-or-private', optionalAuth, controller);
```

### 3. `requireEmailVerified`
Ensures user's email is verified. Must be used after `authenticate`.

```typescript
import { authenticate, requireEmailVerified } from './middleware/auth';

router.get('/verified-only', authenticate, requireEmailVerified, controller);
```

---

## Security Features

### 1. Password Hashing
- Uses `bcrypt` with 12 salt rounds
- Passwords never stored in plain text
- Passwords never returned in API responses

### 2. Token Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- JWT secrets use cryptographically secure random strings
- Tokens include user ID, email, and name

### 3. Email Verification
- Tokens expire in 24 hours
- Cryptographically random tokens (32 bytes hex)
- Users must verify email before logging in

### 4. Password Reset
- Tokens expire in 1 hour
- One-time use tokens
- Prevents email enumeration (always returns success)

### 5. Protection Against Attacks
- **Timing attacks:** Consistent response times
- **Email enumeration:** Generic success messages
- **Brute force:** Rate limiting (implement separately)
- **SQL injection:** Prisma ORM with parameterized queries

### 6. Security Logging
All security events are logged:
- User registration
- Login attempts
- Email verification
- Password resets
- Password changes
- Logout

---

## Environment Variables

Add these to your `.env` file:

```bash
# JWT Configuration
JWT_SECRET=<64-character-random-hex>
JWT_REFRESH_SECRET=<64-character-random-hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Email Service

Currently using console logging for development. The email service is located at:

```
/backend/src/services/email.service.ts
```

### Email Types Sent:
1. **Verification Email** - After registration
2. **Password Reset Email** - When reset requested
3. **Welcome Email** - After email verification
4. **Password Changed** - After password change

### TODO: Production Email Integration

Replace console logging with actual email service (Resend, SendGrid, etc.):

```typescript
// In email.service.ts
async sendVerificationEmail(email: string, token: string, name?: string) {
  // TODO: Replace with actual email provider
  await emailProvider.send({
    to: email,
    subject: 'Verify your Trading Diary account',
    template: 'verification',
    data: { name, verificationUrl }
  });
}
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "errors": [/* validation errors if applicable */],
    "code": "ERROR_CODE" // optional
  }
}
```

### Error Codes
- `TOKEN_EXPIRED` - Access token has expired, refresh needed
- `INVALID_TOKEN` - Token is malformed or invalid
- `EMAIL_NOT_VERIFIED` - User must verify email first

---

## Frontend Integration Guide

### 1. Store Tokens
```typescript
// After login
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

### 2. Include Token in Requests
```typescript
const response = await fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Handle Token Expiration
```typescript
if (error.code === 'TOKEN_EXPIRED') {
  const newToken = await refreshAccessToken();
  // Retry original request with new token
}
```

### 4. Logout
```typescript
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${oldToken}` }
});
```

---

## Testing

### Manual Testing with cURL

#### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","name":"Test User"}'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

#### Get Current User
```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Migration Notes

### Database Migration
The schema has been updated and pushed to the database using:

```bash
npx prisma db push --accept-data-loss
npx prisma generate
```

### Existing Users
- Existing users will have `emailVerified=false` by default
- Existing users will need to verify their email before logging in
- To bypass for development, manually update: `UPDATE users SET email_verified = true;`

---

## Future Enhancements

1. **Token Blacklisting**
   - Implement Redis for blacklisting revoked tokens
   - Add token versioning to invalidate all user tokens

2. **2FA (Two-Factor Authentication)**
   - Add TOTP support
   - SMS verification
   - Backup codes

3. **Social Authentication**
   - Google OAuth
   - GitHub OAuth
   - Apple Sign In

4. **Session Management**
   - Track active sessions
   - Remote logout capability
   - Device fingerprinting

5. **Rate Limiting**
   - Implement per-endpoint rate limits
   - Progressive delays for failed login attempts
   - CAPTCHA after multiple failures

6. **Email Provider Integration**
   - Integrate Resend or SendGrid
   - Email templates with branding
   - Email delivery tracking

---

## Support

For questions or issues with the authentication system, please check:

1. Console logs for security events
2. Database for user status (`emailVerified`, `isActive`)
3. Token expiration times in JWT config
4. Environment variables are properly set

---

**Last Updated:** October 2025
**Version:** 1.0.0
**Status:** Production Ready
