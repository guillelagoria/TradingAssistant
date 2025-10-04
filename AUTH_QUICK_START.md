# Authentication Quick Start Guide

Fast reference for implementing authentication in the Trading Diary app.

## 🚀 Quick Start

### 1. Start the Frontend
```bash
cd frontend
npm run dev
```

The app will now redirect to `/login` for unauthenticated users.

### 2. Available Routes

**Public (No Auth Required):**
- `/login` - Login page
- `/register` - Registration page
- `/verify-email` - Email verification
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password with token

**Protected (Auth Required):**
- `/` - Dashboard
- `/trades` - Trade history
- `/import` - Import trades
- `/settings` - User settings

## 📋 Common Tasks

### Check if User is Logged In

```tsx
import { useAuthStore } from '@/store/authStore';

function MyComponent() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome, {user?.name}!</div>;
}
```

### Get Current User

```tsx
import { useAuthStore } from '@/store/authStore';

function UserProfile() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <p>Email: {user?.email}</p>
      <p>Name: {user?.name}</p>
      <p>Email Verified: {user?.emailVerified ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Logout User

```tsx
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

### Protect a Route

```tsx
import { ProtectedRoute } from '@/components/auth';

// In your routing setup
<Route
  path="/my-protected-page"
  element={
    <ProtectedRoute>
      <MyProtectedPage />
    </ProtectedRoute>
  }
/>
```

### Require Email Verification

```tsx
<ProtectedRoute requireEmailVerification={true}>
  <SensitivePage />
</ProtectedRoute>
```

### Change Password

```tsx
import { useAuthStore } from '@/store/authStore';

function ChangePasswordForm() {
  const { changePassword, isLoading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      await changePassword(
        formData.get('currentPassword'),
        formData.get('newPassword')
      );
      // Success! Toast shown automatically
    } catch (error) {
      // Error! Toast shown automatically
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="currentPassword" type="password" />
      <input name="newPassword" type="password" />
      <button disabled={isLoading}>Change Password</button>
    </form>
  );
}
```

### Make Authenticated API Calls

```tsx
import { api } from '@/services/api';

async function fetchUserData() {
  // Token automatically added by interceptor
  const response = await api.get('/api/user/profile');
  return response.data;
}

async function updateProfile(data) {
  // Token automatically added by interceptor
  const response = await api.put('/api/user/profile', data);
  return response.data;
}
```

### Handle Loading State

```tsx
import { useAuthStore } from '@/store/authStore';

function LoginForm() {
  const { login, isLoading, error } = useAuthStore();

  const handleSubmit = async (data) => {
    await login(data.email, data.password);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <div className="error">{error}</div>}
      <button disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## 🔐 Store API Reference

### State Properties

```typescript
user: User | null              // Current authenticated user
accessToken: string | null     // JWT access token
refreshToken: string | null    // JWT refresh token
isAuthenticated: boolean       // Authentication status
isLoading: boolean            // Loading state for async ops
error: string | null          // Error message
```

### User Object

```typescript
{
  id: string
  email: string
  name: string | null
  emailVerified: boolean
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}
```

### Actions

```typescript
// Authentication
login(email, password): Promise<void>
register(email, password, name): Promise<void>
logout(): void

// Email Verification
verifyEmail(token): Promise<void>

// Password Management
requestPasswordReset(email): Promise<void>
resetPassword(token, password): Promise<void>
changePassword(currentPassword, newPassword): Promise<void>

// Token Management
refreshAccessToken(): Promise<void>
loadUserFromToken(): Promise<void>

// Utilities
checkAuth(): boolean
setError(error): void
clearError(): void
```

## 🎨 UI Components

### AuthLayout

Wrapper for all auth pages with centered card design:

```tsx
import { AuthLayout } from '@/components/auth';

<AuthLayout title="Sign In" subtitle="Welcome back!">
  {/* Your form content */}
</AuthLayout>
```

### PasswordStrength

Shows password strength and requirements:

```tsx
import { PasswordStrength } from '@/components/auth';
import { useState } from 'react';

function MyForm() {
  const [password, setPassword] = useState('');

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordStrength password={password} />
    </div>
  );
}
```

## 🛠️ Development Tips

### 1. Testing Without Backend

If backend isn't ready, you can temporarily bypass auth:

```tsx
// In ProtectedRoute.tsx (DEVELOPMENT ONLY)
if (process.env.NODE_ENV === 'development') {
  return <>{children}</>;
}
```

### 2. Mock User Data

```tsx
// For testing UI
const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  emailVerified: true,
  isActive: true,
};

useAuthStore.setState({
  user: mockUser,
  isAuthenticated: true
});
```

### 3. Clear Auth State

```tsx
// Useful for testing
localStorage.clear();
window.location.reload();
```

### 4. Inspect Current State

```tsx
// In browser console
console.log(useAuthStore.getState());
```

## ⚠️ Common Issues

### Issue: Redirect Loop
**Solution:** Check if tokens are valid in localStorage
```tsx
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

### Issue: Token Not Sent
**Solution:** Verify interceptor is set up correctly in `api.ts`

### Issue: 401 Errors
**Solution:** Backend might not be recognizing tokens. Check:
1. Token format in Authorization header
2. Backend JWT verification
3. Token expiration

### Issue: Form Not Validating
**Solution:** Check zod schema and field names match

## 📱 Mobile Considerations

All auth pages are fully responsive and mobile-optimized:
- Touch-friendly buttons
- Responsive layouts
- Readable text sizes
- Accessible form controls

## 🎯 Next Steps

1. **Implement Backend Auth Endpoints** - See backend auth documentation
2. **Configure Email Service** - For verification and password reset emails
3. **Set Up JWT Secrets** - In backend environment variables
4. **Test All Flows** - Use the testing checklist in main documentation
5. **Add Rate Limiting** - Protect against brute force attacks
6. **Set Up Analytics** - Track auth events
7. **Implement 2FA** - For enhanced security (future)

## 📚 File Locations

Quick reference to find auth files:

```
Types:        src/types/auth.ts
Store:        src/store/authStore.ts
Service:      src/services/auth.service.ts
API Config:   src/services/api.ts
Components:   src/components/auth/
Pages:        src/pages/auth/
Routing:      src/App.tsx
```

## 🔗 Related Documentation

- Full Auth Documentation: `AUTHENTICATION_FRONTEND.md`
- Backend Auth Setup: `backend/README_AUTH.md` (to be created)
- API Documentation: Backend API docs

---

**Need Help?** Check the main authentication documentation for detailed explanations of all features and troubleshooting guides.
