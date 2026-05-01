# ChatroomLM - Self-Hosted Collaborative Chat Platform

A fully self-contained, downloadable web application for real-time chat rooms with AI-powered translation, activity logging, and glossary management. Deploy on your own server without external dependencies.

## Features

- **Real-Time Chat Rooms**: Create and join chat rooms with live message streaming via Socket.IO
- **Room Management**: Create, browse, edit, and delete chat rooms with metadata
- **User Authentication**: Manus OAuth integration with user profiles
- **AI Translation**: Built-in LLM integration for message translation
- **Activity Logging**: Track room events (joins, messages, translations) in the database
- **Glossary**: Save and manage shared terminology within rooms
- **Presence System**: See online users in real-time
- **Dark-Themed Dashboard**: Professional sidebar navigation and responsive design

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS 4 + Vite
- **Backend**: Express.js + tRPC + Socket.IO
- **Database**: MySQL/TiDB compatible (Drizzle ORM)
- **Real-Time**: Socket.IO for live updates
- **Authentication**: Manus OAuth
- **Deployment**: Fully portable—runs on any Node.js server

## Prerequisites

- Node.js 22+
- MySQL 8.0+ or TiDB
- npm or pnpm

## Installation & Setup

### 1. Clone or Extract the Project

```bash
git clone <repository-url>
cd chatroomlm
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/chatroomlm

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_APP_ID=your-app-id
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# LLM (Optional - for AI translation)
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key

# Frontend
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key

# Server
NODE_ENV=production
PORT=3000
```

### 4. Set Up the Database

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate
```

### 5. Build the Application

```bash
npm run build
```

### 6. Start the Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Development

### Local Development Server

```bash
npm run dev
```

This starts the dev server with hot reload at `http://localhost:3001`

### Running Tests

```bash
npm run test
```

### Type Checking

```bash
npm run check
```

## Database Schema

The application uses the following tables:

- **users**: User accounts with OAuth integration
- **user_profiles**: Extended user profile information
- **rooms**: Chat rooms with metadata
- **room_members**: Track room memberships
- **messages**: Chat message history
- **activity_logs**: Event tracking (joins, messages, translations)
- **glossary**: Shared terminology within rooms

All tables include proper foreign keys, indexes, and timestamps for optimal performance.

## Deployment Options

### Docker Deployment

```bash
docker build -t chatroomlm .
docker run -p 3000:80 -e DATABASE_URL=mysql://... chatroomlm
```

### Traditional Server (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <repository-url>
cd chatroomlm
npm install
npm run build

# Run with PM2
npm install -g pm2
pm2 start npm --name "chatroomlm" -- start
pm2 save
pm2 startup
```

### Railway, Heroku, or Similar Platforms

1. Push the repository to GitHub
2. Connect your platform to the repository
3. Set environment variables in the platform's dashboard
4. Deploy

The application is fully compatible with any Node.js hosting platform.

## API Documentation

### tRPC Procedures

All backend operations are exposed via tRPC at `/api/trpc`:

#### Rooms
- `rooms.list` - Get user's rooms
- `rooms.create` - Create a new room
- `rooms.update` - Update room metadata
- `rooms.remove` - Delete a room
- `rooms.search` - Search rooms by name
- `rooms.getById` - Get room details

#### Messages
- `messages.list` - Get room messages
- `messages.create` - Send a message
- `messages.delete` - Delete a message

#### Glossary
- `glossary.list` - Get glossary terms
- `glossary.add` - Add a term
- `glossary.delete` - Remove a term
- `glossary.search` - Search terms

#### Activity Logs
- `activityLogs.list` - Get room events

#### Translation
- `translate.message` - Translate a message

#### Profile
- `profile.get` - Get user profile
- `profile.upsert` - Update user profile

## Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (React 19 + Tailwind)         │
│  - Dashboard Layout with Sidebar        │
│  - Real-time Chat UI                    │
│  - Room Management                      │
│  - Glossary & Activity Log              │
└────────────┬────────────────────────────┘
             │ tRPC + Socket.IO
┌────────────▼────────────────────────────┐
│  Backend (Express + tRPC)               │
│  - Authentication (OAuth)               │
│  - Room Management                      │
│  - Message Handling                     │
│  - Activity Logging                     │
│  - LLM Translation                      │
└────────────┬────────────────────────────┘
             │ Drizzle ORM
┌────────────▼────────────────────────────┐
│  Database (MySQL/TiDB)                  │
│  - Users & Profiles                     │
│  - Rooms & Messages                     │
│  - Activity Logs & Glossary             │
└─────────────────────────────────────────┘
```

## Troubleshooting

### Database Connection Issues

Verify your `DATABASE_URL` format:
```
mysql://username:password@host:port/database
```

### OAuth Not Working

1. Ensure `OAUTH_SERVER_URL` is correct
2. Verify `VITE_APP_ID` matches your OAuth app configuration
3. Check that `VITE_OAUTH_PORTAL_URL` is accessible

### Port Already in Use

Change the `PORT` environment variable:
```bash
PORT=3001 npm start
```

### Build Errors

Clear cache and rebuild:
```bash
rm -rf dist node_modules
npm install
npm run build
```

## Performance Optimization

- Database indexes on frequently queried columns (roomId, userId, createdAt)
- Message pagination (default 50 messages per load)
- Activity log pagination (default 100 events per load)
- CSS minification via Tailwind
- JavaScript bundling and minification via Vite

## Security Considerations

- All sensitive data (JWT_SECRET, API keys) stored in environment variables
- OAuth tokens handled securely via httpOnly cookies
- Database queries use parameterized statements (Drizzle ORM)
- CORS configured for same-origin requests
- Input validation on all tRPC procedures

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Create a feature branch
2. Make your changes
3. Add tests for new features
4. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on GitHub or contact the maintainers.

## Roadmap

- [ ] WebSocket optimization for large-scale deployments
- [ ] Message search and full-text indexing
- [ ] File sharing and media uploads
- [ ] Voice/video chat integration
- [ ] Mobile app (React Native)
- [ ] Admin dashboard for server management
- [ ] Rate limiting and abuse prevention
- [ ] Message encryption

---

**Version**: 1.0.0  
**Last Updated**: April 2026  
**Maintainer**: ChatroomLM Team
# Redeploy test - Thu Apr 30 19:54:56 PDT 2026
