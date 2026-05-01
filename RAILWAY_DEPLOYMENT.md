# Railway Deployment Guide

This guide walks you through deploying ChatroomLM (GitHub OAuth version) to Railway.

## Prerequisites

- GitHub account with a repository containing this code
- Railway account (https://railway.app)
- GitHub OAuth App credentials (see GITHUB_OAUTH_SETUP.md)
- TiDB or MySQL database

## Step 1: Connect GitHub Repository

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select the repository containing this code
6. Railway will auto-detect the Dockerfile and create a service

## Step 2: Set Environment Variables

In the Railway dashboard:

1. Go to your project → Variables
2. Add the following variables:

```
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://your-railway-domain.railway.app/api/oauth/callback
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your_random_secure_string
NODE_ENV=production
PORT=3000
```

### Getting Your Railway Domain

1. After deployment, go to your service in Railway
2. Click "Settings"
3. Under "Domains", you'll see your auto-generated domain (e.g., `chatroomlm-production.up.railway.app`)
4. Use this in `GITHUB_REDIRECT_URI`

## Step 3: Update GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Select your OAuth App
3. Update "Authorization callback URL" to: `https://your-railway-domain.railway.app/api/oauth/callback`
4. Save

## Step 4: Deploy

1. Railway will automatically deploy when you push to the main branch
2. Or manually trigger a deploy:
   - Go to your project in Railway
   - Click "Deploy"
   - Select the latest commit

## Step 5: Verify Deployment

1. Go to your Railway domain
2. Click "Enter Workspace"
3. You should be redirected to GitHub OAuth
4. After authorizing, you should be logged in to the workspace

## Troubleshooting

### Build Fails

- Check Railway logs: Click your service → "Logs"
- Verify Dockerfile exists in repo root
- Ensure `pnpm-lock.yaml` is committed

### OAuth Redirect Error

- Verify `GITHUB_REDIRECT_URI` matches GitHub OAuth App settings exactly
- Check that your Railway domain is correct
- Clear browser cookies and try again

### Database Connection Error

- Verify `DATABASE_URL` format
- For TiDB: ensure SSL is enabled if required
- Check network connectivity from Railway to database

### 502 Bad Gateway

- Check server logs in Railway
- Verify all environment variables are set
- Restart the service

## Custom Domain

To use a custom domain instead of Railway's default:

1. In Railway, go to your service → "Settings" → "Domains"
2. Click "Add Domain"
3. Enter your custom domain (e.g., `chatroomlm.example.com`)
4. Follow DNS setup instructions
5. Update `GITHUB_REDIRECT_URI` to use your custom domain
6. Update GitHub OAuth App callback URL

## Scaling & Performance

- Railway automatically scales based on traffic
- Monitor resource usage in Railway dashboard
- Adjust plan if needed for higher traffic

## Monitoring

Railway provides built-in monitoring:
- Logs: Real-time application logs
- Metrics: CPU, Memory, Network usage
- Deployments: Deployment history and rollback

## Support

- Railway Docs: https://docs.railway.app/
- GitHub OAuth Docs: https://docs.github.com/en/developers/apps/building-oauth-apps
- Project Issues: Check GITHUB_OAUTH_SETUP.md for troubleshooting
