# GitHub OAuth Standalone Setup

This is a standalone version of ChatroomLM that uses GitHub OAuth instead of Manus OAuth.

## Environment Variables Required

```
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://yourdomain.com/api/oauth/callback

# Database (MySQL/TiDB)
DATABASE_URL=mysql://user:password@host:port/database

# Session & Security
JWT_SECRET=your_random_secure_string_here
NODE_ENV=production

# Server
PORT=3000
```

## Setup Steps

### 1. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: ChatroomLM
   - **Homepage URL**: https://yourdomain.com
   - **Authorization callback URL**: https://yourdomain.com/api/oauth/callback
4. Copy the **Client ID** and **Client Secret**

### 2. Set Environment Variables

For **Railway**:
1. Go to your Railway project settings
2. Add the following variables:
   - `GITHUB_CLIENT_ID` = your Client ID
   - `GITHUB_CLIENT_SECRET` = your Client Secret
   - `GITHUB_REDIRECT_URI` = https://yourdomain.com/api/oauth/callback
   - `DATABASE_URL` = your TiDB connection string
   - `JWT_SECRET` = generate a random string (e.g., `openssl rand -base64 32`)
   - `NODE_ENV` = production

For **Local Development**:
1. Create a `.env` file in the project root
2. Add the variables above
3. Run `npm install` and `npm run dev`

### 3. Build & Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start server
npm start
```

## OAuth Flow

1. User clicks "Enter Workspace"
2. Frontend redirects to `/api/oauth/github`
3. Backend redirects to GitHub authorization page
4. User approves access
5. GitHub redirects back to `/api/oauth/callback`
6. Backend exchanges code for access token
7. Backend fetches user info and creates session
8. User is logged in and redirected to workspace

## Features

- ✅ GitHub OAuth authentication
- ✅ Real-time chat and messaging
- ✅ Workspace management
- ✅ User profiles and activity logs
- ✅ Team collaboration
- ✅ Database persistence

## Removed Features (from Manus version)

- ❌ LLM integration (AI Translation)
- ❌ Image generation
- ❌ Manus storage proxy
- ❌ Manus analytics
- ❌ Maps integration

## Deployment

### Railway

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Railway will auto-detect the Dockerfile
4. Deploy

### Other Platforms

The project includes a Dockerfile for containerized deployment:

```bash
docker build -t chatroomlm .
docker run -p 3000:3000 \
  -e GITHUB_CLIENT_ID=xxx \
  -e GITHUB_CLIENT_SECRET=xxx \
  -e DATABASE_URL=xxx \
  -e JWT_SECRET=xxx \
  chatroomlm
```

## Troubleshooting

### "Invalid OAuth route" error
- Check that `GITHUB_REDIRECT_URI` matches exactly in GitHub OAuth App settings
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct

### "Missing authorization code"
- Clear browser cookies
- Try in incognito mode
- Check browser console for errors

### Database connection errors
- Verify `DATABASE_URL` format
- For TiDB: ensure SSL is enabled if required
- Check network connectivity to database

## Support

For issues or questions, refer to:
- GitHub OAuth docs: https://docs.github.com/en/developers/apps/building-oauth-apps
- Express.js docs: https://expressjs.com/
- tRPC docs: https://trpc.io/
