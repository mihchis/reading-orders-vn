import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { initDatabase } from './database/db';
import authRoutes from './routes/auth';
import readingOrdersRoutes from './routes/readingOrders';
import adminRoutes from './routes/admin';
import commonRoutes from './routes/common';

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo Database nếu chưa có
initDatabase();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Đăng ký các Route API
app.use('/api/auth', authRoutes);
app.use('/api/reading-orders', readingOrdersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', commonRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Phục vụ tài nguyên tĩnh công khai (assets, wp-content, wp-includes, wp-json)
const rootDir = process.cwd();

app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use('/wp-content', express.static(path.join(rootDir, 'wp-content')));
app.use('/wp-includes', express.static(path.join(rootDir, 'wp-includes')));
app.use('/wp-json', express.static(path.join(rootDir, 'wp-json')));

app.get('/search_index.json', (req, res) => {
  res.sendFile(path.join(rootDir, 'search_index.json'));
});

// Hàm trả về file HTML
const sendHtml = (res: express.Response, filePath: string) => {
  try {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).send('Error loading page');
  }
};

// Cấm truy cập trực tiếp vào các thư mục nhạy cảm ở root
const protectedPrefixes = ['/server', '/data', '/archive', '/node_modules', '/scripts', '/.git', '/.env'];

// Middleware xử lý và phục vụ tất cả các trang HTML
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  for (const prefix of protectedPrefixes) {
    if (req.path === prefix || req.path.startsWith(prefix + '/')) {
      return res.status(403).send('Forbidden');
    }
  }

  // Nếu là tài nguyên tĩnh khác
  if (/\.(css|js|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot|ico|json)$/i.test(req.path)) {
    const staticFilePath = path.join(rootDir, req.path.replace(/^\//, ''));
    if (fs.existsSync(staticFilePath)) {
      return res.sendFile(staticFilePath);
    }
    return next();
  }

  // Chuẩn hóa path loại bỏ trailing slash
  let cleanPath = req.path.replace(/\/+$/, '');
  if (!cleanPath) cleanPath = '';

  // 1. Nếu đường dẫn chỉ định trực tiếp file .html
  if (req.path.endsWith('.html')) {
    const directHtmlPath = path.join(rootDir, req.path.replace(/^\//, ''));
    if (fs.existsSync(directHtmlPath)) {
      return sendHtml(res, directHtmlPath);
    }
  }

  // 2. Thử tìm index.html trong thư mục con (ví dụ: /marvel/events/house-of-m-reading-order)
  const dirIndexPath = path.join(rootDir, cleanPath, 'index.html');
  if (fs.existsSync(dirIndexPath)) {
    return sendHtml(res, dirIndexPath);
  }

  // 3. Thử tìm file .html tương ứng (ví dụ: /faq.html)
  const htmlFilePath = path.join(rootDir, cleanPath + '.html');
  if (fs.existsSync(htmlFilePath)) {
    return sendHtml(res, htmlFilePath);
  }

  // 4. Fallback về trang chủ nếu không tìm thấy
  const rootIndex = path.join(rootDir, 'index.html');
  if (fs.existsSync(rootIndex)) {
    return sendHtml(res, rootIndex);
  }

  next();
});

app.listen(PORT, () => {
  console.log(`[Reading Orders Web App] Đang chạy tại http://localhost:${PORT}`);
});
