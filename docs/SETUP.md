# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Firebase Setup

### Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name (e.g., "nexus-productivity")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

### Create Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location (closest to your users)
5. Click "Enable"

### Deploy Security Rules

1. In Firestore Database, go to "Rules" tab
2. Copy the content from `firestore.rules` file
3. Paste it in the rules editor
4. Click "Publish"

### Get Firebase Configuration

1. In Firebase Console, click the gear icon → "Project settings"
2. Scroll down to "Your apps"
3. Click the web icon (</>)
4. Register your app with a nickname
5. Copy the firebaseConfig object

## Step 3: Configure Environment Variables

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

## Step 4: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 5: Create Your First Account

1. Click "Sign up"
2. Enter your name, email, and password
3. Click "Sign Up"
4. You're in! Start creating tasks.

## Step 6: Deploy to Production

### Option A: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (only first time)
firebase init hosting
# Select your project
# Public directory: dist
# Single-page app: Yes
# Don't overwrite index.html

# Build and deploy
npm run build
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

### Option B: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Option C: Netlify

```bash
# Build
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Add environment variables in Netlify dashboard
```

## Troubleshooting

### "Firebase not configured" error
- Make sure `.env` file exists and has all variables
- Restart the dev server after creating `.env`

### "Permission denied" in Firestore
- Check that security rules are deployed
- Make sure you're logged in

### Build errors
- Delete `node_modules` and run `npm install` again
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

## Next Steps

1. ✅ Create your first task
2. ✅ Complete a task to earn XP
3. ✅ Check your analytics
4. ✅ Customize categories and difficulties
5. ✅ Build a streak!

## Need Help?

- Check the main README.md for detailed documentation
- Review Firebase documentation: https://firebase.google.com/docs
- Check Vite documentation: https://vitejs.dev

Happy productivity! 🚀
