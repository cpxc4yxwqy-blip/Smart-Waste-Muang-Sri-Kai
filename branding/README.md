# Branding Assets

Place your high-resolution square logo file here as `logo.png` (recommended at least 1024x1024, transparent background preferred).

Then run:

```powershell
npm run icons:generate
```

Generated files will appear in `public/icons/` (ensure that folder exists if needed). After generation, verify:
- `icon-192.png`
- `icon-512.png`
- `icon-maskable-512.png` (if script produces maskable variant)

If you change the filenames or add a maskable icon, update `vite.config.ts` manifest icons accordingly.

