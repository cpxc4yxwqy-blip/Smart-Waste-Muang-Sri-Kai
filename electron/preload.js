const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// Node.js features in a secure way
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron
});
