import cors from 'cors';
import express from 'express';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';
import { AppError } from './utils/AppError';

const app = express();

app.use(cors());
app.use(express.json());

// Only the company-logo subfolder is statically served — it's meant to be publicly
// displayable (headers, quotation branding). Order documents (contracts, customer files,
// receipts) can contain private business/PII data, so they're deliberately NOT under this
// route — see modules/documents' GET /documents/:id/file, which is authenticated and
// company-scoped instead.
app.use('/uploads/company', express.static(path.join(env.uploadPath, 'company')));
// Quotation sample-decor images are marketing/sample photos shown to customers (not PII), so —
// like the company logo — they're served statically for easy <img> display in previews.
app.use('/uploads/quotation-images', express.static(path.join(env.uploadPath, 'quotation-images')));

app.use('/api/v1', apiRouter);

app.use((_req, _res, next) => {
  next(new AppError(404, 'Route not found.'));
});

app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`${env.appName} server listening on port ${env.port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `Port ${env.port} is already in use — a previous server is still running. ` +
        `Run "npm run free-port" (dev/start already do this automatically), then try again.`,
    );
    process.exit(1);
  }
  throw err;
});

// Close the server on exit signals so the port is released promptly (and tsx watch restarts
// cleanly) instead of leaving an orphan that later blocks the port.
function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
