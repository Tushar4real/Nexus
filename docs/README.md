# NEXUS - Social Productivity OS

A modern, gamified productivity application with task management, social features, analytics, and collaboration tools.

## Features

- ✅ **Task Management** - Create, edit, delete tasks with difficulty levels and categories
- 🎮 **Gamification** - Earn XP, level up, unlock badges, and maintain streaks
- 📊 **Analytics Dashboard** - Visualize productivity trends with interactive charts
- 👥 **Social Features** - Community posts, groups, and leaderboards (coming soon)
- 🔐 **Secure Authentication** - Firebase Auth with email/password
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- ⚡ **Real-time Updates** - Firestore real-time database synchronization

## Tech Stack

- **Frontend**: React 18, Vite
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Charts**: Recharts
- **Styling**: Inline styles with design tokens

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   cd App_Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**

   a. Go to [Firebase Console](https://console.firebase.google.com/)
   
   b. Create a new project
   
   c. Enable Authentication:
      - Go to Authentication → Sign-in method
      - Enable "Email/Password"
   
   d. Create Firestore Database:
      - Go to Firestore Database
      - Create database in production mode
      - Deploy the security rules from `firestore.rules`
   
   e. Get your Firebase config:
      - Go to Project Settings → General
      - Scroll to "Your apps" → Web app
      - Copy the configuration

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project**
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Choose your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

Your app will be live at `https://your-project-id.web.app`

### Deploy to Vercel (Alternative)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add environment variables in Vercel dashboard**
   - Go to your project settings
   - Add all `VITE_FIREBASE_*` variables

### Deploy to Netlify (Alternative)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Add environment variables in Netlify dashboard**

## Project Structure

```
App_Project/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Auth.jsx
│   │   ├── Sidebar.jsx
│   │   └── UI.jsx
│   ├── config/          # Configuration files
│   │   └── firebase.js
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useFirestore.js
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Tasks.jsx
│   │   ├── Analytics.jsx
│   │   ├── Community.jsx
│   │   ├── Groups.jsx
│   │   └── Leaderboard.jsx
│   ├── utils/           # Utility functions
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Static assets
├── .env.example         # Environment variables template
├── firebase.json        # Firebase configuration
├── firestore.rules      # Firestore security rules
├── package.json
├── vite.config.js
└── README.md
```

## Scoring System

- **Easy tasks**: 10 XP base
- **Medium tasks**: 25 XP base
- **Hard tasks**: 50 XP base
- **Early completion bonus**: +3 XP per day early (max +15 XP)
- **Late completion penalty**: -10 XP

## Levels

Progress through 15 levels from Novice to Titan:
- Level 1: 0 XP
- Level 2: 100 XP
- Level 3: 250 XP
- ... and so on

## Badges

Earn badges for achievements:
- 🚀 First Step - Complete first task
- 🔥 Hot Streak - 3-day streak
- ⚡ Week Warrior - 7-day streak
- 💪 Challenger - 5 hard tasks
- 🏆 Hard Mode - 10 hard tasks
- ⭐ Rising Star - 500+ score
- 👑 Elite - 1000+ score
- 💎 Legendary - 2000+ score

## Security

- Authentication required for all features
- Firestore security rules enforce user data isolation
- Environment variables for sensitive configuration
- Input validation on all forms

## Future Enhancements

- [ ] Community posts with voting and comments
- [ ] Group collaboration with shared tasks
- [ ] Global leaderboard
- [ ] Real-time notifications
- [ ] Dark/light theme toggle
- [ ] Task reminders
- [ ] AI-powered task suggestions
- [ ] Mobile app (React Native)

## Contributing

This is a portfolio project. Feel free to fork and customize for your own use.

## License

MIT License - feel free to use this project for learning and portfolio purposes.

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using React, Firebase, and modern web technologies.
