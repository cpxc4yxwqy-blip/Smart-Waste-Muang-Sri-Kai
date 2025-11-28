PWA Build & Install

Quick steps to build and test the PWA locally

1. Install dependencies (if you haven't already):

```powershell
npm install
```

2. Build the production bundle:

```powershell
npm run pwa:build
```

3. Serve the `dist/` folder (localhost works for installability):

```powershell
npm run pwa:serve
```

4. Open `http://127.0.0.1:3000/` in Chrome/Edge and check Application > Manifest and Service Worker in DevTools. Use the browser's "Install" UI (or the address-bar install button) to add the app to your system.

Notes

- HTTPS is required for PWA installability when not using `localhost` or `127.0.0.1`.
- Icons are in `public/icons/icon-192.png` and `public/icons/icon-512.png`. If you want custom icons, provide a high-resolution PNG or SVG and I can generate the appropriate sizes and `.ico`.
- To publish the PWA publicly, host the contents of `dist/` on any HTTPS-enabled static host (GitHub Pages, Netlify, Vercel, etc.).

Optional: Using PWABuilder

If you want platform-specific packages (Windows/MSIX, Android APK, etc.), use https://pwabuilder.com/ and provide your hosted site URL or upload the generated manifest. I can help with that step if you want.

Trigger deploy: 2025-11-28T07:50:46.6833315+07:00
