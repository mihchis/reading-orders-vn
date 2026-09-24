if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // ignore if env not found or already loaded
  }
}

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import readingOrdersRoutes from './routes/readingOrders';
import adminRoutes from './routes/admin';
import commonRoutes from './routes/common';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Router tập trung cho toàn bộ API
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/reading-orders', readingOrdersRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/', commonRoutes);

// Phục vụ cả khi req.url giữ nguyên tiền tố /api hoặc bị rewrite bỏ /api
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
