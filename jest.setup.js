// Jest setup file for BE-008 Posts CRUD API tests
require('dotenv').config();

// Mock fetch for Node.js environment
global.fetch = require('node-fetch');

// Mock crypto.randomUUID() if not available in Node.js
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => {
      // Simple UUID v4 implementation
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
  };
}

// Set test timeout
jest.setTimeout(30000);
