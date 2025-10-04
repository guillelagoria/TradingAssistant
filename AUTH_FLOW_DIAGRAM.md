# Authentication Flow Diagrams

Visual representation of authentication flows in the Trading Diary application.

## 1. Registration Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Navigate to /register
       ▼
┌─────────────────────────────────────────┐
│         RegisterPage.tsx                │
│  ┌───────────────────────────────────┐  │
│  │  - Name input                     │  │
│  │  - Email input                    │  │
│  │  - Password input                 │  │
│  │  - Confirm password               │  │
│  │  - Password strength indicator    │  │
│  │  - Terms checkbox                 │  │
│  └───────────────────────────────────┘  │
└─────────────┬───────────────────────────┘
              │
              │ 2. Form submission
              ▼
       ┌──────────────┐
       │  Validation  │
       │  (zod)       │
       └──────┬───────┘
              │
              │ 3. If valid
              ▼
┌─────────────────────────────────────────┐
│      authStore.register()               │
│  - Set loading state                    │
│  - Call authService.register()          │
└─────────────┬───────────────────────────┘
              │
              │ 4. API call
              ▼
┌─────────────────────────────────────────┐
│   POST /api/auth/register               │
│   Body: { email, password, name }       │
└─────────────┬───────────────────────────┘
              │
              │ 5. Backend validates & creates user
              ▼
┌─────────────────────────────────────────┐
│   Response: {                           │
│     accessToken,                        │
│     refreshToken,                       │
│     user: { id, email, name, ... }      │
│   }                                     │
└─────────────┬───────────────────────────┘
              │
              │ 6. Store tokens & user
              ▼
       ┌──────────────┐
       │ localStorage │
       │  - accessToken
       │  - refreshToken
       │  - user
       └──────┬───────┘
              │
              │ 7. Update store state
              ▼
┌─────────────────────────────────────────┐
│   authStore state:                      │
│   - user: User object                   │
│   - accessToken: string                 │
│   - refreshToken: string                │
│   - isAuthenticated: true               │
└─────────────┬───────────────────────────┘
              │
              │ 8. Show success toast
              │ 9. Redirect to /
              ▼
       ┌──────────────┐
       │  Dashboard   │
       └──────────────┘
```

## 2. Login Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Navigate to /login
       ▼
┌─────────────────────────────────────────┐
│           LoginPage.tsx                 │
│  ┌───────────────────────────────────┐  │
│  │  - Email input                    │  │
│  │  - Password input                 │  │
│  │  - Remember me checkbox           │  │
│  │  - Forgot password link           │  │
│  └───────────────────────────────────┘  │
└─────────────┬───────────────────────────┘
              │
              │ 2. Form submission
              ▼
       ┌──────────────┐
       │  Validation  │
       └──────┬───────┘
              │
              │ 3. If valid
              ▼
┌─────────────────────────────────────────┐
│      authStore.login()                  │
│  - Set loading state                    │
│  - Call authService.login()             │
└─────────────┬───────────────────────────┘
              │
              │ 4. API call
              ▼
┌─────────────────────────────────────────┐
│   POST /api/auth/login                  │
│   Body: { email, password }             │
└─────────────┬───────────────────────────┘
              │
              │ 5. Backend validates credentials
              ▼
┌─────────────────────────────────────────┐
│   Response: {                           │
│     accessToken,                        │
│     refreshToken,                       │
│     user: { ... }                       │
│   }                                     │
└─────────────┬───────────────────────────┘
              │
              │ 6. Store & redirect
              ▼
       ┌──────────────┐
       │  Dashboard   │
       └──────────────┘
```

## 3. Protected Route Access Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Navigate to /dashboard
       ▼
┌─────────────────────────────────────────┐
│       ProtectedRoute.tsx                │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  useEffect on mount            │    │
│  │    - loadUserFromToken()       │    │
│  └────────────┬───────────────────┘    │
│               │                        │
└───────────────┼────────────────────────┘
                │
                ▼
         ┌─────────────┐
         │ Check token │
         │ in storage? │
         └──────┬──────┘
                │
       ┌────────┴────────┐
       │                 │
    No │                 │ Yes
       ▼                 ▼
  ┌─────────┐    ┌────────────────┐
  │ Redirect│    │ GET /api/auth/me
  │ to login│    └────────┬───────┘
  └─────────┘             │
                          ▼
                   ┌─────────────┐
                   │ Token valid?│
                   └──────┬──────┘
                          │
                 ┌────────┴────────┐
                 │                 │
              No │                 │ Yes
                 ▼                 ▼
          ┌─────────────┐   ┌──────────┐
          │Try refresh  │   │  Render  │
          │   token     │   │  children│
          └──────┬──────┘   └──────────┘
                 │
        ┌────────┴────────┐
        │                 │
     Success           Failure
        │                 │
        ▼                 ▼
  ┌──────────┐      ┌─────────┐
  │  Render  │      │ Redirect│
  │ children │      │ to login│
  └──────────┘      └─────────┘
```

## 4. Token Refresh Flow

```
┌─────────────┐
│ Browser API │
│   Request   │
└──────┬──────┘
       │
       │ 1. User makes API call
       ▼
┌─────────────────────────────────────────┐
│    Request Interceptor (api.ts)         │
│  - Add Authorization: Bearer {token}    │
└─────────────┬───────────────────────────┘
              │
              │ 2. Request sent
              ▼
       ┌──────────────┐
       │   Backend    │
       └──────┬───────┘
              │
              │ 3. Token expired (401)
              ▼
┌─────────────────────────────────────────┐
│   Response Interceptor (api.ts)         │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ Detect 401 error               │    │
│  │ Queue current request          │    │
│  └────────────┬───────────────────┘    │
└───────────────┼────────────────────────┘
                │
                ▼
         ┌─────────────┐
         │ Refresh in  │
         │ progress?   │
         └──────┬──────┘
                │
       ┌────────┴────────┐
       │                 │
    Yes│                 │ No
       │                 │
       │                 ▼
       │         ┌────────────────┐
       │         │ Set refresh    │
       │         │ flag = true    │
       │         └────────┬───────┘
       │                  │
       │                  │ 4. Call refresh endpoint
       │                  ▼
       │         ┌─────────────────────────┐
       │         │ POST /api/auth/refresh  │
       │         │ Body: { refreshToken }  │
       │         └────────┬────────────────┘
       │                  │
       │                  │ 5. New tokens
       │                  ▼
       │         ┌─────────────────────────┐
       │         │ Update localStorage     │
       │         │  - accessToken (new)    │
       │         │  - refreshToken (new)   │
       │         └────────┬────────────────┘
       │                  │
       │                  │ 6. Set flag = false
       │                  │    Process queue
       ▼                  ▼
┌─────────────────────────────────────────┐
│   Wait & then retry original request    │
│   with new token                        │
└─────────────┬───────────────────────────┘
              │
              │ 7. Return response
              ▼
       ┌──────────────┐
       │   Browser    │
       └──────────────┘

If refresh fails:
  - Clear all tokens
  - Clear user state
  - Redirect to /login
```

## 5. Password Reset Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Click "Forgot Password"
       ▼
┌─────────────────────────────────────────┐
│      ForgotPasswordPage.tsx             │
│  ┌───────────────────────────────────┐  │
│  │  Enter email                      │  │
│  │  Click "Send reset instructions"  │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼─────────────────────┘
                   │
                   │ 2. Submit email
                   ▼
┌─────────────────────────────────────────┐
│   POST /api/auth/request-password-reset │
│   Body: { email }                       │
└─────────────┬───────────────────────────┘
              │
              │ 3. Backend sends email with token
              ▼
       ┌──────────────┐
       │ User's Email │
       │  ┌────────┐  │
       │  │ Reset  │  │
       │  │ Link   │  │
       │  └───┬────┘  │
       └──────┼───────┘
              │
              │ 4. Click reset link
              │    /reset-password?token=abc123
              ▼
┌─────────────────────────────────────────┐
│       ResetPasswordPage.tsx             │
│  ┌───────────────────────────────────┐  │
│  │  Extract token from URL           │  │
│  │  Enter new password               │  │
│  │  Confirm password                 │  │
│  │  Password strength indicator      │  │
│  └───────────────┬───────────────────┘  │
└──────────────────┼─────────────────────┘
                   │
                   │ 5. Submit new password
                   ▼
┌─────────────────────────────────────────┐
│   POST /api/auth/reset-password         │
│   Body: { token, password }             │
└─────────────┬───────────────────────────┘
              │
              │ 6. Backend validates token & updates password
              ▼
       ┌──────────────┐
       │   Success    │
       │   message    │
       └──────┬───────┘
              │
              │ 7. Redirect to /login
              ▼
       ┌──────────────┐
       │  LoginPage   │
       └──────────────┘
```

## 6. Logout Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. User clicks logout
       ▼
┌─────────────────────────────────────────┐
│      authStore.logout()                 │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ 1. Call backend (optional)     │    │
│  │    POST /api/auth/logout       │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ 2. Clear localStorage          │    │
│  │    - accessToken               │    │
│  │    - refreshToken              │    │
│  │    - user                      │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ 3. Reset store state           │    │
│  │    - user: null                │    │
│  │    - accessToken: null         │    │
│  │    - refreshToken: null        │    │
│  │    - isAuthenticated: false    │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ 4. Show toast notification     │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
              │
              │ 5. Redirect to /login
              ▼
       ┌──────────────┐
       │  LoginPage   │
       └──────────────┘
```

## 7. Email Verification Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ After registration
       ▼
       ┌──────────────┐
       │ User's Email │
       │  ┌────────┐  │
       │  │ Verify │  │
       │  │ Link   │  │
       │  └───┬────┘  │
       └──────┼───────┘
              │
              │ Click verify link
              │ /verify-email?token=xyz789
              ▼
┌─────────────────────────────────────────┐
│      VerifyEmailPage.tsx                │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  useEffect on mount            │    │
│  │    - Extract token from URL    │    │
│  │    - Call verifyEmail(token)   │    │
│  └────────────┬───────────────────┘    │
└───────────────┼────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   POST /api/auth/verify-email           │
│   Body: { token }                       │
└─────────────┬───────────────────────────┘
              │
              │ Backend marks email as verified
              ▼
       ┌──────────────┐
       │   Update     │
       │ user.email   │
       │  Verified    │
       │  = true      │
       └──────┬───────┘
              │
              │ Success message
              │ Redirect to /
              ▼
       ┌──────────────┐
       │  Dashboard   │
       └──────────────┘
```

## Key Components

### Data Flow

```
┌──────────────┐
│  UI Pages    │  LoginPage, RegisterPage, etc.
└──────┬───────┘
       │ uses
       ▼
┌──────────────┐
│  Auth Store  │  State management (Zustand)
└──────┬───────┘
       │ calls
       ▼
┌──────────────┐
│ Auth Service │  API calls (axios)
└──────┬───────┘
       │ uses
       ▼
┌──────────────┐
│   API.ts     │  Axios instance with interceptors
└──────┬───────┘
       │ calls
       ▼
┌──────────────┐
│   Backend    │  Express API endpoints
└──────────────┘
```

### Token Storage

```
localStorage
├── accessToken    (JWT, short-lived, e.g., 15 min)
├── refreshToken   (JWT, long-lived, e.g., 7 days)
└── user          (JSON string, user object)
```

### Security Layers

```
┌─────────────────────────────────────────┐
│  1. Form Validation (Client)           │
│     - react-hook-form + zod             │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  2. Request Validation (API)            │
│     - Token in header                   │
│     - Token format check                │
└─────────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  3. Backend Validation                  │
│     - JWT verification                  │
│     - User permissions                  │
│     - Input sanitization                │
└─────────────────────────────────────────┘
```

---

These diagrams provide a visual reference for understanding how authentication works throughout the application.
