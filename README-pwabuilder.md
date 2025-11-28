# PWABuilder Export Guide

Use PWABuilder to generate native-like packages (MSIX for Windows, APK for Android) from your existing PWA.

## 1. Prerequisites
- Your PWA is live over HTTPS: `https://cpxc4yxwqy-blip.github.io/Smart-Waste-Muang-Sri-Kai/`
- Manifest includes name, icons (192, 512), start_url, display, theme_color, background_color.
- Service Worker provides offline (already added: offline.html fallback).

## 2. Quick Export via Web
1. Visit https://www.pwabuilder.com/
2. Enter your PWA URL and click "Start".
3. Review checks (Manifest / Service Worker / HTTPS). Fix any failing items.
4. Go to "Packages" tab.
5. Generate:
   - Windows package (MSIX)
   - Android package (APK / AAB)
   - (Optional) iOS wrapper (requires additional config, limited support)

## 3. Store Submission Notes
- Windows Store: Provide description, screenshots, privacy statement if network requests occur.
- Android Play Store: Provide high‑res icon (512x512), feature graphic, short/long description, content rating.

## 4. Advanced: Local CLI Build
You can script packaging locally (experimental):
```bash
npx pwabuilder --manifest https://cpxc4yxwqy-blip.github.io/Smart-Waste-Muang-Sri-Kai/manifest.webmanifest --target windows android
```
(Check PWABuilder docs; CLI may change.)

## 5. Improving Install Quality
- Add a maskable icon (512x512) to manifest (`purpose": "any maskable"`).
- Provide larger screenshot images for store listings.
- Ensure fast first load (lazy imports added for main views).

## 6. Versioning Strategy
Use `npm run release` to bump version & update CHANGELOG automatically (edit CHANGELOG.md after run if needed), then:
```powershell
npm run release:patch
git push --follow-tags
npm run deploy
```
The `__APP_VERSION__` will reflect updated package.json version after rebuild.

## 7. Troubleshooting
- Missing Service Worker: Ensure production build (`npm run pwa:build`) and hosting the `dist/` output.
- Icon not updating: Clear browser cache or increment filename hash.
- Offline not working: Re-check Workbox `navigateFallback` path and that offline.html is published.

## 8. Next Enhancements
- Add push notifications (requires user permission and server endpoint).
- Add periodic background sync for refreshing cached API data.
- Integrate analytics events (page view + custom events).

---
Need help generating store metadata or adding a maskable icon? Provide your source logo and I will automate icon generation.
