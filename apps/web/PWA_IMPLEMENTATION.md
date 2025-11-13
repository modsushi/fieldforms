# PWA Implementation Guide

## Overview

FieldForms has been upgraded to a Progressive Web App (PWA) with full offline capabilities. This document explains what was implemented, how to test it, and what remains to be done.

---

## What Was Implemented (Phase 1)

### 1. Service Worker with Workbox ✅

**Location:** `next.config.js`, `public/sw.js`

**Features:**
- Automatic asset caching (JS, CSS, images, fonts)
- Network-first strategy for API calls with 10s timeout
- Cache-first strategy for images and fonts
- Stale-while-revalidate for static resources
- Offline fallback page
- Background Sync API integration

**Cache Strategies:**
```javascript
API calls → NetworkFirst (24h cache, 10s timeout)
Images → CacheFirst (30 days, max 64 entries)
Fonts → CacheFirst (1 year, max 10 entries)
JS/CSS → StaleWhileRevalidate (24h, max 32 entries)
```

### 2. PWA Manifest ✅

**Location:** `public/manifest.json`

**Configuration:**
- App name: "FieldForms - Field Service Management"
- Display mode: Standalone (full-screen app experience)
- Theme color: #3b82f6 (Blue)
- Orientation: Portrait
- Icon sizes: 72, 96, 128, 144, 152, 192, 384, 512px
- Share Target API configured for file sharing

### 3. Background Sync ✅

**Location:** `src/lib/offline/background-sync.ts`, `src/components/sw-sync-handler.tsx`

**Features:**
- Automatic retry when connection restored
- Service Worker message passing
- Integration with existing sync engine
- Visibility change detection (syncs when user returns to tab)
- Online/offline event listeners

### 4. File Sync Implementation ✅

**Location:** `src/lib/storage/offline-storage.ts`, `src/lib/offline/db.ts`

**Features:**
- IndexedDB storage for file blobs
- Automatic S3 upload when online
- Retry mechanism (max 5 attempts)
- Batch upload (10 files per sync)
- File statistics and cleanup
- Storage of uploaded URLs

**Database Schema:**
```typescript
files: {
  id, fileName, fileType, fileSize,
  fileData (Blob), path, uploadedUrl,
  synced, createdAt, uploadAttempts, lastError
}
```

### 5. iOS Safari Support ✅

**Location:** `src/app/layout.tsx`

**Added Meta Tags:**
- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style`
- `apple-mobile-web-app-title`
- Apple touch icons (152x152, 192x192)
- Viewport settings optimized for mobile

### 6. Offline Fallback Page ✅

**Location:** `public/offline.html`

**Features:**
- Beautiful gradient design
- Shows offline status
- Auto-reload when connection restored
- Lists offline capabilities
- 5-second connection check interval

---

## File Structure

```
apps/web/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── offline.html           # Offline fallback page
│   ├── sw.js                  # Service worker
│   └── icons/                 # App icons (need to be created)
│       └── README.md          # Icon generation guide
├── src/
│   ├── app/
│   │   └── layout.tsx         # PWA meta tags
│   ├── components/
│   │   ├── offline-indicator.tsx  # Existing offline UI
│   │   └── sw-sync-handler.tsx    # Service worker sync handler
│   └── lib/
│       ├── offline/
│       │   ├── db.ts                    # IndexedDB schema (v2)
│       │   ├── sync-engine.ts           # Main sync engine (with file sync)
│       │   ├── background-sync.ts       # Background sync integration
│       │   └── manager.ts               # Existing offline manager
│       └── storage/
│           ├── offline-storage.ts       # File storage implementation
│           └── s3-client.ts             # S3 upload client
├── next.config.js             # PWA plugin configuration
└── scripts/
    └── generate-icons.js      # Icon placeholder generator
```

---

## How to Test

### Local Testing

1. **Build the app:**
   ```bash
   cd /home/automato/code/fieldforms/apps/web
   npm run build
   npm start
   ```

2. **Open Chrome DevTools:**
   - Press F12
   - Go to "Application" tab
   - Check "Manifest" section - should show all metadata
   - Check "Service Workers" section - should show registered SW
   - Check "Storage" > "IndexedDB" > "FieldFormDB" - should have 5 tables

3. **Test Offline Mode:**
   - Open DevTools > Network tab
   - Check "Offline" checkbox
   - Refresh the page - should show offline.html
   - Navigate through app - cached pages should work
   - Submit a form - should save to IndexedDB
   - Uncheck "Offline" - data should sync automatically

4. **Test File Upload:**
   - Go offline
   - Capture a photo or upload file
   - Check IndexedDB > files table - should store blob
   - Go online
   - File should auto-upload to S3
   - Check file.uploadedUrl in IndexedDB

### Mobile Testing

#### Android (Chrome)

1. **Enable HTTPS (required for PWA):**
   ```bash
   # Option 1: Use ngrok
   npx ngrok http 3000

   # Option 2: Use local HTTPS
   # Update next.config.js to enable HTTPS
   ```

2. **Test Installation:**
   - Visit app URL on Android Chrome
   - Look for "Add to Home Screen" prompt
   - Or tap menu (⋮) > "Install app"
   - Icon should appear on home screen
   - Tap icon - should open as standalone app

3. **Test Offline:**
   - Enable Airplane mode
   - Open installed app
   - Should show offline indicator
   - Create form submission
   - Disable Airplane mode
   - Data should sync automatically

#### iOS (Safari)

1. **Visit the app in Safari**

2. **Install to Home Screen:**
   - Tap Share button (⬆️)
   - Scroll and tap "Add to Home Screen"
   - Edit name if desired
   - Tap "Add"

3. **Limitations on iOS:**
   - No Background Sync API (will use interval sync)
   - No notification support
   - Limited storage quota
   - No install banner (manual only)

---

## Testing Checklist

### Service Worker
- [ ] Service worker registers successfully
- [ ] Static assets are cached
- [ ] Offline page shows when offline
- [ ] Cache updates on app update
- [ ] Background sync triggers on reconnection

### Offline Sync
- [ ] Form submissions save offline
- [ ] Submissions sync when online
- [ ] Retry mechanism works for failures
- [ ] Pending count shows correctly
- [ ] Last sync time updates

### File Sync
- [ ] Photos captured offline save to IndexedDB
- [ ] Files show preview from blob URL
- [ ] Files upload when connection restored
- [ ] Upload progress tracked
- [ ] Failed uploads retry (max 5 times)
- [ ] Uploaded URL stored correctly

### PWA Installation
- [ ] Install prompt appears (Android)
- [ ] Add to Home Screen works (iOS)
- [ ] App opens in standalone mode
- [ ] App icon displays correctly
- [ ] Splash screen shows (Android)
- [ ] Status bar styled correctly

### Mobile UX
- [ ] Touch targets are large enough
- [ ] Forms work with mobile keyboard
- [ ] Camera capture works
- [ ] Geolocation works
- [ ] Orientation changes handled
- [ ] No horizontal scrolling

---

## What's Missing (To Be Done)

### 1. App Icons (REQUIRED) 🔴

The PWA will not install without proper PNG icons.

**Action Required:**
- Create actual PNG files for all sizes
- Use online generator: https://www.pwabuilder.com/imageGenerator
- Or use design tool (Figma, Illustrator, etc.)
- Replace `.svg` placeholders in `public/icons/`

**See:** `public/icons/README.md` for detailed instructions

### 2. HTTPS Configuration (REQUIRED for Production) 🔴

PWAs require HTTPS in production.

**Options:**
- Deploy to Vercel/Netlify (automatic HTTPS)
- Use Cloudflare (free SSL)
- Set up Let's Encrypt on your server
- Use reverse proxy (nginx) with SSL

### 3. Upload API Endpoint

**Current Status:** S3 client exists but `/api/upload` endpoint may need verification

**Check:**
- Verify `/api/upload` route exists and works
- Test file upload to S3/MinIO
- Ensure proper error handling
- Add file size limits
- Add file type validation

### 4. Storage Quota Management

**Recommended:**
- Add quota check before saving files
- Show storage usage to user
- Implement cleanup UI for old files
- Handle quota exceeded errors gracefully

### 5. Enhanced Conflict Resolution

**Current:** Simple last-write-wins
**Needed:**
- UI to show conflicting changes
- Field-level merge strategies
- Version tracking
- User choice for conflict resolution

### 6. Push Notifications (Optional)

**For:**
- Work order assignments
- Sync completion alerts
- Error notifications

**Implementation:**
- Add Firebase Cloud Messaging
- Request notification permission
- Handle push events in service worker

### 7. Periodic Background Sync (Optional)

**For:**
- Auto-sync even when app is closed
- Requires registration and permission

```javascript
// In service worker
await registration.periodicSync.register('sync-data', {
  minInterval: 60 * 60 * 1000, // 1 hour
});
```

### 8. App Store Deployment (Optional)

**If native app features needed:**
- Set up Capacitor
- Configure iOS/Android projects
- Submit to App Store/Play Store

---

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# S3/MinIO Configuration
NEXT_PUBLIC_S3_URL=http://localhost:9000/fieldform
S3_BUCKET=fieldform
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Build Configuration

To disable PWA in development (already configured):

```javascript
// next.config.js
disable: process.env.NODE_ENV === 'development',
```

To enable PWA in development for testing:

```javascript
disable: false,
```

---

## Troubleshooting

### Service Worker Not Updating

1. **Force update:**
   - DevTools > Application > Service Workers
   - Click "Unregister"
   - Refresh page

2. **Skip waiting:**
   ```javascript
   // In SW
   self.skipWaiting();
   ```

### Files Not Syncing

1. **Check IndexedDB:**
   - DevTools > Application > IndexedDB > FieldFormDB > files
   - Verify `synced` field is `false`
   - Check `uploadAttempts` < 5

2. **Check network:**
   - DevTools > Network tab
   - Look for failed `/api/upload` requests
   - Check error messages in console

3. **Manual trigger:**
   ```javascript
   import { offlineFileStorage } from '@/lib/storage/offline-storage';
   await offlineFileStorage.syncFiles();
   ```

### PWA Not Installing

1. **Check manifest:**
   - DevTools > Application > Manifest
   - Look for errors (usually missing icons)

2. **Verify HTTPS:**
   - PWA requires HTTPS (except localhost)
   - Check URL protocol

3. **Check install criteria:**
   - Service worker registered
   - Manifest exists and is valid
   - All icons load successfully
   - Has `start_url`

### IndexedDB Errors

1. **Version mismatch:**
   - Clear IndexedDB in DevTools
   - Refresh page (will recreate with v2)

2. **Quota exceeded:**
   ```javascript
   // Check quota
   const estimate = await navigator.storage.estimate();
   console.log(`Using ${estimate.usage} of ${estimate.quota} bytes`);
   ```

3. **Cleanup old data:**
   ```javascript
   await offlineFileStorage.cleanupOldFiles(30); // 30 days
   ```

---

## Performance Considerations

### Storage Limits

**IndexedDB:**
- Chrome: ~60% of free disk space (per origin)
- Firefox: ~50% of free disk space
- Safari: 1GB max
- Mobile: Varies, often 50-500MB

**Recommendations:**
- Monitor storage usage
- Clean up synced files > 30 days old
- Compress images before storing
- Set max file size limits (e.g., 10MB per file)

### Battery & Data Usage

**Be mindful of:**
- Sync frequency (currently 30s interval)
- File upload size (batch upload max 10 files)
- Background sync triggering too often

**Optimizations:**
- Increase sync interval for battery saving
- Use delta sync (only changed data)
- Compress files before upload
- Only sync on WiFi (optional setting)

---

## Security Considerations

1. **File Validation:**
   - Validate file types before upload
   - Check file size limits
   - Scan for malware in production

2. **HTTPS Required:**
   - Service workers only work on HTTPS
   - Ensures data encryption in transit

3. **Content Security Policy:**
   - Update CSP headers to allow SW
   - Whitelist S3 domain for images

4. **Authentication:**
   - Ensure API calls include auth tokens
   - Handle 401 errors gracefully offline
   - Don't cache authenticated responses

---

## Monitoring & Analytics

### Recommended Tracking

1. **PWA Install Rate:**
   ```javascript
   window.addEventListener('appinstalled', () => {
     analytics.track('PWA Installed');
   });
   ```

2. **Offline Usage:**
   ```javascript
   window.addEventListener('offline', () => {
     analytics.track('Went Offline');
   });
   ```

3. **Sync Success Rate:**
   ```javascript
   const result = await syncEngine.sync();
   analytics.track('Sync Completed', {
     success: result.success,
     failed: result.failed,
   });
   ```

4. **File Upload Stats:**
   ```javascript
   const stats = await offlineFileStorage.getStats();
   analytics.track('File Storage Stats', stats);
   ```

---

## Next Steps

1. **Immediate (Required):**
   - [ ] Generate proper app icons
   - [ ] Test PWA installation on mobile devices
   - [ ] Verify `/api/upload` endpoint works
   - [ ] Set up HTTPS for production

2. **Short Term (Recommended):**
   - [ ] Add storage quota monitoring
   - [ ] Implement file cleanup UI
   - [ ] Add sync status indicators
   - [ ] Test on various devices/browsers

3. **Medium Term (Optional):**
   - [ ] Add push notifications
   - [ ] Implement periodic background sync
   - [ ] Add conflict resolution UI
   - [ ] Set up PWA analytics

4. **Long Term (If Needed):**
   - [ ] Evaluate Capacitor for native features
   - [ ] Submit to app stores
   - [ ] Add native camera integration
   - [ ] Implement native file system access

---

## Resources

### Documentation
- [Next PWA Plugin](https://ducanh-next-pwa.vercel.app/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### Tools
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse (PWA Audit)](https://developers.google.com/web/tools/lighthouse)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Web.dev](https://web.dev/progressive-web-apps/)

### Icon Generators
- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [Real Favicon Generator](https://realfavicongenerator.net/)
- [App Icon Generator](https://appicon.co/)

---

## Support

For issues or questions:
1. Check this documentation
2. Check browser console for errors
3. Use DevTools Application panel
4. Review `public/icons/README.md` for icon help
