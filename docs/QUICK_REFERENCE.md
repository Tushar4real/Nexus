# Quick Reference Card

## 🚀 Essential Commands

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Firebase
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Deploy to Firebase Hosting
firebase deploy

# View deployment history
firebase hosting:channel:list
```

### Git
```bash
# Initialize repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit"

# Add remote
git remote add origin <your-repo-url>

# Push to GitHub
git push -u origin main
```

## 📋 File Locations

| What | Where |
|------|-------|
| Firebase config | `src/config/firebase.js` |
| Environment vars | `.env` |
| Auth logic | `src/hooks/useAuth.js` |
| Database logic | `src/hooks/useFirestore.js` |
| UI components | `src/components/UI.jsx` |
| Pages | `src/pages/` |
| Constants | `src/utils/constants.js` |
| Helpers | `src/utils/helpers.js` |

## 🔑 Environment Variables

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## 🎯 Key Features

| Feature | Status | File |
|---------|--------|------|
| Authentication | ✅ Ready | `components/Auth.jsx` |
| Task CRUD | ✅ Ready | `pages/Tasks.jsx` |
| Dashboard | ✅ Ready | `pages/Dashboard.jsx` |
| Analytics | ✅ Ready | `pages/Analytics.jsx` |
| Community | 🚧 Placeholder | `pages/Community.jsx` |
| Groups | 🚧 Placeholder | `pages/Groups.jsx` |
| Leaderboard | 🚧 Placeholder | `pages/Leaderboard.jsx` |

## 🔧 Customization Points

### Colors (src/utils/constants.js)
```javascript
export const C = {
  accent: "#f59e0b",  // Change primary color
  success: "#22c55e", // Change success color
  danger: "#ef4444",  // Change danger color
  // ... more colors
};
```

### Scoring (src/utils/constants.js)
```javascript
export const DIFF_SCORES = {
  Easy: 10,   // Change XP for easy tasks
  Medium: 25, // Change XP for medium tasks
  Hard: 50    // Change XP for hard tasks
};
```

### Levels (src/utils/constants.js)
```javascript
export const LEVEL_XP = [0, 100, 250, 500, ...];
export const LEVEL_NAMES = ["Novice", "Apprentice", ...];
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Firebase not configured | Check `.env` file exists and has all variables |
| Permission denied | Deploy Firestore security rules |
| Build fails | Delete `node_modules`, run `npm install` |
| Port 3000 in use | Change port in `vite.config.js` |
| Can't login | Check Firebase Auth is enabled |

## 📱 Testing Checklist

- [ ] Signup works
- [ ] Login works
- [ ] Create task works
- [ ] Complete task works
- [ ] XP increases
- [ ] Level updates
- [ ] Analytics show data
- [ ] Mobile responsive
- [ ] Logout works

## 🌐 Deployment URLs

After deployment, your app will be at:

- **Firebase**: `https://your-project-id.web.app`
- **Vercel**: `https://your-app.vercel.app`
- **Netlify**: `https://your-app.netlify.app`

## 📚 Documentation

- [README.md](README.md) - Full documentation
- [SETUP.md](SETUP.md) - Setup instructions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment checklist
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - What was improved

## 🆘 Need Help?

1. Check the documentation files
2. Review Firebase Console for errors
3. Check browser console for errors
4. Verify environment variables
5. Ensure Firebase services are enabled

## 🎉 Quick Start (3 Steps)

```bash
# 1. Install
npm install

# 2. Configure (edit .env with Firebase credentials)
cp .env.example .env

# 3. Run
npm run dev
```

---

**Pro Tip**: Keep this file handy for quick reference! 📌
