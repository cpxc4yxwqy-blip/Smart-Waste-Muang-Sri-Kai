import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'robots.txt'],
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
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
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
