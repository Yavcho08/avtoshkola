"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Must run before any module that reads process.env
const app_1 = __importDefault(require("./src/app"));
const PORT = Number(process.env.PORT) || 5000;
// When running in a serverless environment (like Vercel), we shouldn't start a long-running server.
// Vercel sets VERCEL="1" in its environment.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const server = app_1.default.listen(PORT, () => {
        console.log(`[server] Running in ${process.env.NODE_ENV ?? 'development'} mode on port ${PORT}`);
    });
    // Graceful shutdown — lets in-flight requests finish before closing.
    const shutdown = (signal) => {
        console.log(`[server] ${signal} received — shutting down gracefully…`);
        server.close(() => {
            console.log('[server] Closed. Exiting.');
            process.exit(0);
        });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}
exports.default = app_1.default; // Required by Vercel Serverless Functions
//# sourceMappingURL=server.js.map