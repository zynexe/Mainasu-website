# Mainasu v2.0

A full-stack web application for rating waifus and music, built with React, TypeScript, Vite, and Supabase.

## Live Demo

https://mainasu-website.vercel.app/

## Features

### Waifu Rating System

- Browse and rate your favorite anime characters
- 10-point rating scale with half-point precision
- Visual card-based interface
- User avatars displayed on votes
- Search and filter functionality
- Pagination support

### Music Rating System

- **Hybrid Upload System**
  - Direct audio file uploads (MP3, WAV, FLAC, etc.)
  - YouTube embed support
  - Spotify embed support
  - SoundCloud link integration
- **Advanced Features**
  - Built-in audio player with progress bar
  - 10-point rating scale
  - Confidence-based sorting (rewards songs with more votes)
  - Real-time vote display with user avatars
  - Edit/Delete functionality (owner-only)
  - Search by title or artist
  - Pagination with 15 songs per page
  - Uploader attribution

### User Management

- Multi-user system with localStorage persistence
- Custom avatars (upload or emoji picker)
- User switching functionality
- Profile-based permissions

### UI/UX

- Modern dark theme design
- Smooth GSAP animations
- Fully responsive (desktop & mobile)
- Mobile-optimized navigation
- Interactive modals and forms
- Loading states and error handling

## Tech Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **GSAP** - Animation library
- **React Router** - Client-side routing

### Backend

- **Supabase** - Backend as a Service
  - PostgreSQL Database with Row Level Security
  - Real-time subscriptions
  - File storage for music uploads
  - Custom authentication system

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/mainasu-website.git
cd mainasu-website
```
