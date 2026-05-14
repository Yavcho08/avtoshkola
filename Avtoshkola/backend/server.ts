import dotenv from 'dotenv';
dotenv.config(); // Must run before any module that reads process.env

import app from './src/app';

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`[server] Running in ${process.env.NODE_ENV ?? 'development'} mode on port ${PORT}`);
});

// Graceful shutdown — lets in-flight requests finish before closing.
const shutdown = (signal: string) => {
  console.log(`[server] ${signal} received — shutting down gracefully…`);
  server.close(() => {
    console.log('[server] Closed. Exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
