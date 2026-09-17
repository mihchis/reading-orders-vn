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

// Phục vụ trang web chính từ thư mục site đã mirror
const sitePath = path.resolve(process.cwd(), 'site');
if (fs.existsSync(sitePath)) {
  // Hàm chèn addon CSS và JS vào HTML trước khi trả về cho client
  const sendEnhancedHtml = (res: express.Response, filePath: string) => {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (!content.includes('/assets/addon.css')) {
        const addonTags = `\n<link rel="stylesheet" href="/assets/addon.css">\n<script src="/assets/addon.js" defer></script>\n`;
        if (content.includes('</head>')) {
          content = content.replace('</head>', `${addonTags}</head>`);
        } else {
          content = `${addonTags}${content}`;
        }
      }
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.send(content);
    } catch (err) {
      res.sendFile(filePath);
    }
  };

  // Middleware xử lý và phục vụ tất cả các trang HTML qua sendEnhancedHtml
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    
    // Nếu là tài nguyên tĩnh rõ ràng (không phải html), chuyển cho express.static bên dưới
    if (/\.(css|js|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot|ico|json)$/i.test(req.path)) {
      return next();
    }

    // Chuẩn hóa path loại bỏ query string
    let cleanPath = req.path.replace(/\/+$/, '');
    if (!cleanPath) cleanPath = '';

    // 1. Nếu đường dẫn chỉ định trực tiếp file .html (ví dụ: /other/the-boys-reading-order/index.html)
    if (req.path.endsWith('.html')) {
      const directHtmlPath = path.join(sitePath, req.path.replace(/^\//, ''));
      if (fs.existsSync(directHtmlPath)) {
        return sendEnhancedHtml(res, directHtmlPath);
      }
    }

    // 2. Thử tìm index.html trong thư mục con (ví dụ: /marvel/events/house-of-m-reading-order)
    const dirIndexPath = path.join(sitePath, cleanPath, 'index.html');
    if (fs.existsSync(dirIndexPath)) {
      return sendEnhancedHtml(res, dirIndexPath);
    }

    // 3. Thử tìm file .html tương ứng (ví dụ: /faq.html)
    const htmlFilePath = path.join(sitePath, cleanPath + '.html');
    if (fs.existsSync(htmlFilePath)) {
      return sendEnhancedHtml(res, htmlFilePath);
    }

    // 4. Fallback về trang chủ nếu không tìm thấy
    const rootIndex = path.join(sitePath, 'index.html');
    if (fs.existsSync(rootIndex)) {
      return sendEnhancedHtml(res, rootIndex);
    }

    next();
  });

  // Phục vụ tài nguyên tĩnh không phải html (css, js, images, fonts)
  app.use(express.static(sitePath, {
    index: false
  }));
}

app.listen(PORT, () => {
  console.log(`[Reading Orders Web App] Đang chạy tại http://localhost:${PORT}`);
});
