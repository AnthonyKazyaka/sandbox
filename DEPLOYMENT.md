# Deployment Guide

## GitHub Pages Deployment with Google Calendar Integration

This repository is configured to automatically deploy to GitHub Pages with Google Calendar API credentials injected during the build process.

## Prerequisites

1. A Google Cloud Project with Calendar API enabled
2. OAuth 2.0 Client ID for web applications
3. GitHub repository with Pages enabled

## Setup Instructions

### 1. Get Google Calendar OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Add authorized JavaScript origins:
     - `https://[your-username].github.io`
     - `http://localhost:8080` (for local development)
   - Add authorized redirect URIs:
     - `https://[your-username].github.io/[repo-name]/gps-admin/`
     - `http://localhost:8080/gps-admin/` (for local development)
   - Click "Create"
5. Copy the Client ID (format: `XXXXX.apps.googleusercontent.com`)

### 2. Configure GitHub Repository Secret

1. Go to your GitHub repository
2. Navigate to "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Create the following secret:
   - **Name**: `GOOGLE_CALENDAR_CLIENT_ID`
   - **Value**: Your Google OAuth Client ID (e.g., `123456789-abc123.apps.googleusercontent.com`)
5. Click "Add secret"

### 3. Deploy

The application will automatically deploy when you:
- Push to the `main` branch (production deployment)
- Push to any feature branch (preview deployment with manual approval)

#### Production Deployment (Main Branch)
- Triggered on push to `main`
- Deploys to: `https://[username].github.io/[repo-name]/gps-admin/`
- Workflow: `.github/workflows/static.yml`

#### Preview Deployment (Feature Branches)
- Triggered on push to any branch except `main`/`master`
- Deploys to: `https://[username].github.io/[repo-name]/[branch-name]/`
- Requires manual approval via GitHub Actions environment
- Workflow: `.github/workflows/deploy-branch-preview.yml`

### 4. Verify Deployment

1. Wait for the GitHub Actions workflow to complete
2. Navigate to the deployment URL
3. The application should load with Google Calendar integration enabled
4. Click "Connect Google Calendar" to test OAuth flow

## Local Development

For local development without GitHub Actions:

1. Copy the example config:
   ```bash
   cp gps-admin/config.example.js gps-admin/config.local.js
   ```

2. Edit `gps-admin/config.local.js` and add your Client ID:
   ```javascript
   window.GPSConfig = {
       calendar: {
           clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
       },
       maps: {
           apiKey: '', // Optional
       },
       app: {
           useMockData: false,
           debug: true,
       }
   };
   ```

3. Start a local server:
   ```bash
   # Python 3
   python -m http.server 8080

   # Node.js (if you have npx)
   npx http-server -p 8080
   ```

4. Open `http://localhost:8080/gps-admin/`

**Note**: `config.local.js` is in `.gitignore` and will never be committed to the repository.

## Security Best Practices

### ✅ What We're Doing Right

1. **No secrets in code**: Client ID is stored in GitHub Secrets, not in the repository
2. **Automated injection**: Config file is generated during deployment, not committed
3. **Fallback mechanism**: App falls back to example config if local config is missing
4. **Local development**: Developers use `config.local.js` which is gitignored

### ⚠️ Important Notes

1. **OAuth Client ID is not a secret**: While we store it in GitHub Secrets for convenience, the OAuth Client ID is designed to be public and will be visible in the deployed application's JavaScript
2. **Client-side OAuth**: This is a client-side application using OAuth 2.0 with PKCE (Proof Key for Code Exchange), which is secure for browser-based apps
3. **No Client Secret**: We do NOT use or need the OAuth Client Secret for client-side apps
4. **API restrictions**: Protect your Google Cloud project by:
   - Setting authorized domains in OAuth consent screen
   - Restricting API keys to specific domains
   - Enabling only necessary APIs

### 🔒 Additional Security Measures

If you want to add the Google Maps API Key in the future:

1. Create another repository secret: `GOOGLE_MAPS_API_KEY`
2. Update both workflow files to inject it:
   ```yaml
   apiKey: '${{ secrets.GOOGLE_MAPS_API_KEY }}',
   ```
3. Restrict the API key in Google Cloud Console to only your domain

## Troubleshooting

### "Google Calendar connection failed"

1. Verify the Client ID secret is set correctly in GitHub
2. Check that the workflow ran successfully
3. Ensure authorized JavaScript origins include your GitHub Pages domain
4. Check browser console for specific error messages

### "Workflow failed during deployment"

1. Check that `GOOGLE_CALENDAR_CLIENT_ID` secret exists
2. Verify the secret name matches exactly (case-sensitive)
3. Review GitHub Actions logs for specific errors

### "Config not loading"

1. Check browser console for JavaScript errors
2. Verify `config.local.js` was created in the deployment
3. Ensure `config.example.js` exists as a fallback

## Advanced Configuration

### Environment-Specific Settings

You can create different configurations for different deployment environments by modifying the workflow files:

**Development/Preview** (`deploy-branch-preview.yml`):
```javascript
app: {
    useMockData: false,
    debug: true, // Enable debug mode for previews
}
```

**Production** (`static.yml`):
```javascript
app: {
    useMockData: false,
    debug: false, // Disable debug in production
}
```

### Multiple API Keys

If you need different API keys for different environments:

1. Create environment-specific secrets:
   - `GOOGLE_CALENDAR_CLIENT_ID_PROD`
   - `GOOGLE_CALENDAR_CLIENT_ID_DEV`

2. Update workflows to use the appropriate secret based on environment

## Questions?

If you encounter issues not covered in this guide, please:
1. Check the GitHub Actions workflow logs
2. Review the browser console for errors
3. Verify Google Cloud Console configuration
4. Check that all authorized domains are configured correctly
