# PWA Quick Start Guide

## TL;DR - Get Started in 5 Minutes

### What You Need to Do

1. **Generate Icons** (REQUIRED)
   ```bash
   # Visit https://www.pwabuilder.com/imageGenerator
   # Upload a 512x512px logo
   # Download and extract to apps/web/public/icons/
   ```

2. **Build & Test**
   ```bash
   cd apps/web
   npm run build
   npm start
   # Open http://localhost:3000
   ```

3. **Test Offline**
   - Open Chrome DevTools (F12)
   - Network tab → Check "Offline"
   - Refresh page → Should see offline page
   - Uncheck "Offline" → Should work normally

4. **Deploy with HTTPS** (for mobile testing)
   - Use Vercel/Netlify, OR
   - Use ngrok: `npx ngrok http 3000`

---

## What's New

### ✅ Implemented
- Service Worker (auto-caching, offline support)
- Background Sync (auto-retry when online)
- File Sync (photos upload from IndexedDB to S3)
- PWA Manifest (installable app)
- iOS Support (Add to Home Screen)

### ⚠️ Required Before Use
- Generate actual PNG icons (currently SVG placeholders)
- Verify `/api/upload` endpoint works
- Deploy with HTTPS for production

---

## File Sync Usage

### Save a File Offline
```typescript
import { offlineFileStorage } from '@/lib/storage/offline-storage';

// When user captures a photo
const fileId = await offlineFileStorage.saveFile(file, 'photos/');
// File is saved to IndexedDB with blob data
```

### Get File URL
```typescript
// Returns uploaded URL if synced, otherwise blob URL
const url = await offlineFileStorage.getFileUrl(fileId);
```

### Manual Sync
```typescript
const result = await offlineFileStorage.syncFiles();
console.log(`Uploaded ${result.success} files, ${result.failed} failed`);
```

### Check Stats
```typescript
const stats = await offlineFileStorage.getStats();
// { totalFiles, syncedFiles, pendingFiles, failedFiles, totalSize }
```

---

## Testing Commands

```bash
# Generate icon placeholders
npm run generate-icons

# Build and start PWA
npm run pwa:build

# Check PWA score
npm run pwa:analyze
# Then: DevTools > Lighthouse > Generate report
```

---

## Debugging

### Service Worker Not Working?
```javascript
// DevTools Console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('SW registered:', registrations.length > 0);
});
```

### Files Not Syncing?
```javascript
// DevTools Console
import { offlineFileStorage } from '@/lib/storage/offline-storage';
const stats = await offlineFileStorage.getStats();
console.log(stats);
```

### Check IndexedDB
```
DevTools > Application > IndexedDB > FieldFormDB
- Check 'files' table for unsynced files
- Look for uploadAttempts < 5
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| PWA won't install | Generate PNG icons, rebuild app |
| SW not registering | Check HTTPS, clear cache, hard reload |
| Files not uploading | Verify `/api/upload` endpoint exists |
| Offline page not showing | Check Network tab is truly offline |
| iOS install not working | Use Safari Share → Add to Home Screen |

---

## Production Checklist

- [ ] Generate proper app icons (PNG files)
- [ ] Test `/api/upload` endpoint
- [ ] Set up HTTPS
- [ ] Test on Android Chrome
- [ ] Test on iOS Safari
- [ ] Run Lighthouse PWA audit (score > 90)
- [ ] Verify file uploads work
- [ ] Test offline mode extensively

---

## Documentation

- **Full Guide:** `PWA_IMPLEMENTATION.md` (comprehensive)
- **Summary:** `PHASE_1_COMPLETE.md` (what was built)
- **This File:** `QUICK_START.md` (quick reference)
- **Icons:** `public/icons/README.md` (icon guide)

---

## Need Help?

1. Check `PWA_IMPLEMENTATION.md` troubleshooting section
2. Open Chrome DevTools → Application tab
3. Check browser console for errors
4. Verify all files in PHASE_1_COMPLETE.md exist
