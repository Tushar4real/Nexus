# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables configured in `.env`
- [ ] Firebase project created and configured
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Security rules deployed to Firestore
- [ ] App tested locally (`npm run dev`)
- [ ] All features working (signup, login, tasks, analytics)
- [ ] No console errors in browser
- [ ] Responsive design tested on mobile/tablet/desktop

## Build & Test

- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm run preview`
- [ ] Check build size (should be < 1MB for optimal performance)
- [ ] Verify all routes work in production build
- [ ] Test authentication flow
- [ ] Test task CRUD operations
- [ ] Verify charts render correctly

## Firebase Hosting Deployment

- [ ] Firebase CLI installed: `npm install -g firebase-tools`
- [ ] Logged in to Firebase: `firebase login`
- [ ] Firebase initialized: `firebase init hosting`
- [ ] Build created: `npm run build`
- [ ] Deployed: `firebase deploy`
- [ ] Test live URL: `https://your-project-id.web.app`

## Post-Deployment Verification

- [ ] Live site loads correctly
- [ ] Can create new account
- [ ] Can login with existing account
- [ ] Can create tasks
- [ ] Can complete tasks
- [ ] XP and levels update correctly
- [ ] Analytics page shows data
- [ ] Charts render properly
- [ ] Mobile responsive design works
- [ ] No 404 errors on page refresh
- [ ] Logout works correctly

## Security Checklist

- [ ] Environment variables not committed to Git
- [ ] `.env` file in `.gitignore`
- [ ] Firestore security rules deployed
- [ ] Authentication required for all protected routes
- [ ] User data isolated (users can only access their own data)
- [ ] No sensitive data exposed in client code

## Performance Optimization

- [ ] Images optimized (if any added)
- [ ] Code splitting implemented (Vite does this automatically)
- [ ] Lazy loading for routes (optional enhancement)
- [ ] Firestore queries optimized (indexed if needed)
- [ ] Bundle size checked and optimized

## Monitoring & Maintenance

- [ ] Firebase Console bookmarked
- [ ] Authentication users monitored
- [ ] Firestore usage monitored (free tier limits)
- [ ] Error tracking set up (optional: Sentry)
- [ ] Analytics set up (optional: Google Analytics)

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL certificate (automatic with Firebase Hosting)
- [ ] PWA features (service worker, manifest)
- [ ] Social media meta tags
- [ ] Favicon added
- [ ] Loading states improved
- [ ] Error boundaries added
- [ ] Toast notifications for user feedback

## Documentation

- [ ] README.md updated with live URL
- [ ] SETUP.md reviewed and accurate
- [ ] Code comments added where needed
- [ ] API documentation (if applicable)

## Backup & Recovery

- [ ] Firestore backup strategy planned
- [ ] Export rules: `firebase firestore:rules > firestore.rules.backup`
- [ ] Git repository backed up
- [ ] Environment variables documented securely

## Launch

- [ ] Announce to users/portfolio
- [ ] Share on social media
- [ ] Add to portfolio website
- [ ] Update LinkedIn/resume
- [ ] Gather user feedback

---

## Quick Deploy Commands

```bash
# Build
npm run build

# Deploy to Firebase
firebase deploy

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## Rollback (if needed)

```bash
# Firebase - view previous deployments
firebase hosting:channel:list

# Vercel - rollback in dashboard
# Netlify - rollback in dashboard
```

---

**Remember**: Test thoroughly before deploying to production!
