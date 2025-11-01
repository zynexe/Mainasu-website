# Quick Reference - Supabase Integration

## 🚀 Quick Start Commands

```bash
# Install Supabase
npm install @supabase/supabase-js

# Start dev server
npm run dev

# Build for production
npm run build
```

## 📁 File Structure After Supabase Integration

```
src/
├── lib/
│   └── supabaseClient.ts      # Supabase client initialization
├── contexts/
│   └── AuthContext.tsx         # Authentication context
├── pages/
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   └── Auth.tsx                # Login/Signup page
└── ...
```

## 🔑 Environment Variables

Create `.env.local`:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 🗄️ Database Tables

### profiles
- id (UUID, primary key)
- username (TEXT, unique)
- avatar_url (TEXT)
- bio (TEXT)
- created_at, updated_at

### posts
- id (UUID, primary key)
- user_id (UUID, foreign key)
- content (TEXT)
- created_at

### events
- id (UUID, primary key)
- title (TEXT)
- description (TEXT)
- event_date (TIMESTAMP)
- created_by (UUID, foreign key)
- created_at

## 🔐 Common Auth Operations

### Sign Up
```typescript
const { signUp } = useAuth()
await signUp(email, password, username)
```

### Sign In
```typescript
const { signIn } = useAuth()
await signIn(email, password)
```

### Sign Out
```typescript
const { signOut } = useAuth()
await signOut()
```

### Check if User is Logged In
```typescript
const { user, loading } = useAuth()

if (loading) return <div>Loading...</div>
if (!user) return <Navigate to="/auth" />
```

## 📊 Database Operations

### Fetch Data
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })
```

### Insert Data
```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({ user_id: user.id, content: 'Hello!' })
```

### Update Data
```typescript
const { data, error } = await supabase
  .from('posts')
  .update({ content: 'Updated!' })
  .eq('id', postId)
```

### Delete Data
```typescript
const { data, error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
```

## 🔴 Real-time Subscriptions

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('posts')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'posts' },
      (payload) => {
        console.log('Change received!', payload)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])
```

## 🖼️ File Upload

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file)

// Get public URL
const { data: publicURL } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`)
```

## 🛡️ Protected Route Example

```typescript
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/auth" />

  return children
}

// Usage in App.tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

## 🎨 Discord OAuth Login Button

```typescript
const signInWithDiscord = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
  })
  if (error) console.error(error)
}

<button onClick={signInWithDiscord}>
  Sign in with Discord
</button>
```

## 🔍 Useful Queries

### Get user profile
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

### Get posts with user info
```typescript
const { data: posts } = await supabase
  .from('posts')
  .select(`
    *,
    profiles (username, avatar_url)
  `)
  .order('created_at', { ascending: false })
```

### Count total members
```typescript
const { count } = await supabase
  .from('profiles')
  .select('*', { count: 'exact', head: true })
```

## 🎯 Next Features to Build

1. **User Profiles**
   - View profile page
   - Edit profile (username, bio, avatar)
   - User stats

2. **Posts/Feed**
   - Create posts
   - Like/comment system
   - Feed with pagination

3. **Events**
   - Create events
   - RSVP system
   - Calendar view

4. **Real-time Chat**
   - Channel-based chat
   - Direct messages
   - Online status

5. **Notifications**
   - Real-time notifications
   - Mark as read
   - Notification preferences

## 📚 Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Library](https://supabase.com/docs/reference/javascript)
- [GSAP Docs](https://greensock.com/docs/)
- [React Router Docs](https://reactrouter.com/)
