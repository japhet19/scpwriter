# Google OAuth Setup for PlotCraft

## Steps to Enable Google Authentication

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

### 2. Create OAuth 2.0 Credentials

1. In Google Cloud Console, go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - Name: "PlotCraft OAuth"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `https://eugpgiusruulacnnjyhj.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)

5. Copy the Client ID and Client Secret

### 3. Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/eugpgiusruulacnnjyhj/auth/providers)
2. Under Authentication > Providers, find Google
3. Enable Google provider
4. Add:
   - Client ID: (paste from Google Cloud Console)
   - Client Secret: (paste from Google Cloud Console)
5. Save the configuration

### 4. Update Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `http://localhost:3000` (for development)
- Redirect URLs: Add `http://localhost:3000/auth/callback`

### 5. Test the Flow

1. Start your development server
2. Navigate to `/signin`
3. Click "GOOGLE AUTHENTICATION"
4. Complete the Google sign-in flow
5. Verify you're redirected back to PlotCraft

## Production Considerations

When deploying to production:
1. Update all localhost URLs to your production domain
2. Add production domain to Google OAuth authorized origins/redirects
3. Update Supabase redirect URLs
4. Use environment variables for sensitive configuration