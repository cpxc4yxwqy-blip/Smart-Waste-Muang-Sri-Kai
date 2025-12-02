import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: process.env.ELECTRON ? './' : '/Smart-Waste-Muang-Sri-Kai/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest',
          srcDir: 'src',
          filename: 'sw.ts',
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'robots.txt', 'offline.html'],
          manifest: {
            name: 'Si Khai Waste Smart Dashboard',
            short_name: 'WasteDash',
            description: 'Dashboard for Si Khai waste management',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        __APP_VERSION__: JSON.stringify(pkg.version)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
      ,
      build: {
        // Reduce large bundle sizes by manual chunking
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react', 'react-dom'],
              recharts: ['recharts'],
              vendor: ['lucide-react', 'react-markdown', '@google/genai']
            }
          }
        },
        // Increase warning threshold for chunk size to avoid noisy warnings
        chunkSizeWarningLimit: 1000
      }
    };
});
