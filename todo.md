# ChatroomLM - Self-Hosted Web Application TODO

## Database Schema & Migrations
- [x] Define rooms table (id, name, description, createdBy, createdAt, updatedAt, memberCount)
- [x] Define messages table (id, roomId, userId, content, createdAt, updatedAt)
- [x] Define activity_logs table (id, roomId, userId, action, entityType, entityId, metadata, createdAt)
- [x] Define glossary table (id, roomId, term, definition, createdBy, createdAt, updatedAt)
- [x] Define user_profiles table (userId, birthdate, location, profession, position, skills, interests, quote, websites, socials, coping)
- [x] Generate and apply Drizzle migrations
- [x] Add foreign keys and indexes for performance

## Backend: tRPC Procedures & Database Helpers
- [x] Implement room CRUD procedures (list, create, update, delete, search)
- [x] Implement message procedures (list, create, delete)
- [x] Implement activity log procedures (list, getRoomActivityLogs)
- [x] Implement glossary procedures (list, create, delete)
- [x] Implement user profile procedures (get, upsert)
- [x] Implement presence procedures (counts, online users per room)
- [x] Add database helpers in server/db.ts for all queries
- [ ] Write vitest tests for critical procedures

## Socket.IO Integration
- [ ] Set up Socket.IO server with Express
- [ ] Implement room join/leave events with typing indicators
- [ ] Implement real-time message broadcasting
- [ ] Implement presence tracking (online users per room)
- [ ] Implement activity log event emission
- [ ] Handle disconnections and cleanup

## Frontend: Dark-Themed Dashboard Layout
- [x] Create DashboardLayout component with sidebar navigation
- [x] Implement dark theme with CSS variables in index.css
- [x] Create sidebar navigation for rooms, profile, glossary, activity log
- [x] Create main content area with dynamic page rendering
- [x] Add user profile display in header with logout option
- [x] Implement responsive design for mobile

## Room Management UI
- [x] Create RoomList page with room browser
- [x] Create CreateRoom modal/form
- [ ] Create EditRoom modal/form
- [ ] Create DeleteRoom confirmation dialog
- [x] Display member count and room metadata
- [ ] Implement room search functionality
- [ ] Add join/leave room actions

## Chat UI & Real-Time Features
- [x] Create ChatRoom page with message list
- [x] Implement message input with send button
- [ ] Display typing indicators from other users
- [ ] Show online presence (who's in the room)
- [x] Implement message history scrolling
- [x] Add message timestamps and user avatars
- [ ] Implement real-time message updates via Socket.IO

## AI Translation Feature
- [x] Create translate button/option in chat messages
- [x] Integrate invokeLLM for translation
- [ ] Display translated message in UI
- [ ] Add language selection for translation
- [ ] Cache translations to avoid duplicate API calls

## Glossary Panel
- [x] Create Glossary page with term list
- [x] Implement add term form
- [ ] Implement delete term confirmation
- [x] Display term definitions with formatting
- [ ] Add search/filter for glossary terms
- [x] Link glossary to specific rooms

## Activity Log Panel
- [x] Create ActivityLog page with event list
- [x] Display room-specific events (joins, messages, translations)
- [x] Add timestamp and user info to each event
- [ ] Implement filtering by event type
- [ ] Add pagination for large logs
- [x] Display metadata (room name, message preview, etc.)

## Presence System
- [ ] Implement online user tracking per room
- [ ] Display user list in chat UI
- [ ] Show presence status (online/offline)
- [ ] Update presence in real-time via Socket.IO
- [ ] Add user avatars to presence list

## Authentication & User Profiles
- [x] Verify Manus OAuth integration
- [x] Create user profile page
- [x] Implement profile edit form (birthdate, location, profession, etc.)
- [x] Display user avatar and name in header
- [x] Implement logout functionality
- [ ] Add role-based access control (admin vs user)

## Testing & Validation
- [ ] Write vitest tests for database helpers
- [ ] Write vitest tests for tRPC procedures
- [ ] Test Socket.IO events and real-time updates
- [ ] Test UI components with user interactions
- [x] Verify dark theme consistency across all pages
- [ ] Test responsive design on mobile devices

## Deployment & Self-Hosting
- [x] Create comprehensive README with setup instructions
- [x] Document environment variables required
- [x] Create Docker configuration for containerization
- [x] Create docker-compose.yml for local MySQL/TiDB setup
- [x] Add database initialization scripts
- [x] Package application for download
- [x] Create deployment guide for common hosting platforms
- [x] Verify all external dependencies are documented

## Documentation
- [x] Document API procedures and their inputs/outputs
- [x] Create user guide for chat features
- [x] Document database schema with ER diagram
- [x] Create troubleshooting guide
- [x] Add development setup instructions
