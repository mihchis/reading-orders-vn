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

// Middleware bắt mọi request tài nguyên tĩnh (dù là relative path từ thư mục con sâu như /marvel/events/wp-includes/...)
app.use((req, res, next) => {
  const match = req.path.match(/\/(wp-content|wp-includes|assets|wp-json)\/(.+)$/);
  if (match) {
    const [, folder, subpath] = match;
    const resolvedPath = path.join(rootDir, folder, subpath);
    if (fs.existsSync(resolvedPath)) {
      return res.sendFile(resolvedPath);
    }
  }
  next();
});

app.use('/assets', express.static(path.join(rootDir, 'assets')));
app.use('/wp-content', express.static(path.join(rootDir, 'wp-content')));
app.use('/wp-includes', express.static(path.join(rootDir, 'wp-includes')));
app.use('/wp-json', express.static(path.join(rootDir, 'wp-json')));

app.get('/search_index.json', (req, res) => {
  res.sendFile(path.join(rootDir, 'search_index.json'));
});

// Đường dẫn và Regex các components dùng chung
const componentsDir = path.join(rootDir, 'components');
const headerNavComponentPath = path.join(componentsDir, 'header-nav.html');
const footerComponentPath = path.join(componentsDir, 'footer.html');
const overlaysComponentPath = path.join(componentsDir, 'overlays.html');
const footerScriptsComponentPath = path.join(componentsDir, 'footer-scripts.html');
const readingLegendComponentPath = path.join(componentsDir, 'reading-legend.html');

const headerNavRegex = /<div class="x-logobar">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i;
const footerRegex = /<footer class="x-colophon"[\s\S]*?<\/footer>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/footer>/i;
const overlaysRegex = /<div class="x-searchform-overlay">[\s\S]*?<\/div>\s*<!-- END \.x-root -->/i;
const scriptsRegex = /<script type="speculationrules">[\s\S]*?<\/body>/i;
const legendRegex = /<div class="x-section[^"]*?"[^>]*?>[\s\S]*?(?:Bộ truyện dài kỳ|Ongoing Series)[\s\S]*?(?:Ghi chú đọc|Comments)[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i;
const yoastSchemaRegex = /<script type="application\/ld\+json" class="yoast-schema-graph">[\s\S]*?<\/script>/i;
const csPageCssRegex = /<style id="cs-page-css">[\s\S]*?<\/style>/i;

// Hàm trả về file HTML có nhúng components dùng chung
const sendHtml = (res: express.Response, filePath: string) => {
  try {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    let content = fs.readFileSync(filePath, 'utf8');

    // 0. Đảm bảo base href="/" để các liên kết/tài nguyên tương đối luôn trỏ đúng về root
    if (!content.includes('<base href=')) {
      content = content.replace(/<head>/i, '<head>\n<base href="/">');
    }

    // 1. Header Navigation
    if (fs.existsSync(headerNavComponentPath)) {
      const sharedHeaderNav = fs.readFileSync(headerNavComponentPath, 'utf8').trim();
      if (sharedHeaderNav && headerNavRegex.test(content)) {
        content = content.replace(headerNavRegex, sharedHeaderNav);
      }
    }

    // 2. Footer
    if (fs.existsSync(footerComponentPath)) {
      const sharedFooter = fs.readFileSync(footerComponentPath, 'utf8').trim();
      if (sharedFooter && footerRegex.test(content)) {
        content = content.replace(footerRegex, sharedFooter);
      }
    }

    // 3. Overlays
    if (fs.existsSync(overlaysComponentPath)) {
      const sharedOverlays = fs.readFileSync(overlaysComponentPath, 'utf8').trim();
      if (sharedOverlays && overlaysRegex.test(content)) {
        content = content.replace(overlaysRegex, sharedOverlays);
      }
    }

    // 4. Footer Scripts
    if (fs.existsSync(footerScriptsComponentPath)) {
      const sharedScripts = fs.readFileSync(footerScriptsComponentPath, 'utf8').trim();
      if (sharedScripts && scriptsRegex.test(content)) {
        content = content.replace(scriptsRegex, sharedScripts + '\n</body>');
      }
    }

    // 6. Dọn dẹp Yoast Schema JSON-LD rác
    if (yoastSchemaRegex.test(content)) {
      content = content.replace(yoastSchemaRegex, '');
    }

    // 7. Chuyển CSS Inline cs-page-css ra ngoài
    if (csPageCssRegex.test(content)) {
      content = content.replace(csPageCssRegex, '');
    }

    res.send(content);
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

  // 5. 404 Fallback tùy chỉnh thân thiện, tránh CSP 'default-src none' mặc định của Express
  res.status(404).type('text/html').send(`<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>404 - Không tìm thấy trang</title></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>404 - Không tìm thấy trang</h2><p>Trang bạn yêu cầu không tồn tại hoặc đã được di chuyển.</p><p><a href="/">Quay về trang chủ</a></p></body></html>`);
});

app.listen(PORT, () => {
  console.log(`[Reading Orders Web App] Đang chạy tại http://localhost:${PORT}`);
});
