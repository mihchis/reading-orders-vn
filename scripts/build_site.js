const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('🚀 Đang chuẩn bị bản build từ thư mục gốc (root)...');
const startTime = Date.now();

// 1. Tạo mới thư mục dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Danh sách các thư mục và file thuộc website tĩnh cần build
const siteItems = [
  'assets',
  'comments',
  'contact',
  'dc',
  'faq',
  'feed',
  'marvel',
  'other',
  'updates',
  'wp-content',
  'wp-includes',
  'wp-json',
  'index.html',
  'search_index.json'
];

let htmlCount = 0;
let fileCount = 0;

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fileCount++;
      if (entry.name.endsWith('.html')) {
        htmlCount++;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

for (const item of siteItems) {
  const src = path.join(rootDir, item);
  const dest = path.join(distDir, item);
  if (!fs.existsSync(src)) continue;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyRecursive(src, dest);
  } else if (stat.isFile()) {
    fileCount++;
    if (item.endsWith('.html')) htmlCount++;
    fs.copyFileSync(src, dest);
  }
}

// 2. Tạo các trang alias/redirect tại gốc cho toàn bộ reading orders
const searchIndexDest = path.join(distDir, 'search_index.json');
if (fs.existsSync(searchIndexDest)) {
  try {
    const items = JSON.parse(fs.readFileSync(searchIndexDest, 'utf8'));
    let aliasCount = 0;
    const reserved = ['marvel', 'dc', 'other', 'updates', 'faq', 'contact', 'assets', 'wp-content', 'wp-includes', 'wp-json'];

    for (const item of items) {
      if (!item.slug || !item.url || reserved.includes(item.slug)) continue;

      const slugDir = path.join(distDir, item.slug);
      if (!fs.existsSync(slugDir)) {
        fs.mkdirSync(slugDir, { recursive: true });
        const redirectHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${item.url}">
  <link rel="canonical" href="${item.url}">
  <title>${item.title || 'Reading Order'}</title>
  <script>window.location.replace("${item.url}");</script>
</head>
<body>
  <p>Đang chuyển hướng đến <a href="${item.url}">${item.title || 'Reading Order'}</a>...</p>
</body>
</html>`;
        fs.writeFileSync(path.join(slugDir, 'index.html'), redirectHtml, 'utf8');
        aliasCount++;
      }
    }
    console.log(`🔗 Đã tạo ${aliasCount} đường dẫn trực tiếp (alias/redirect) cho các reading orders.`);
  } catch (err) {
    console.warn('Lỗi khi tạo alias redirect:', err);
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`✅ Build hoàn tất trong ${duration}s!`);
console.log(`📊 Đã copy ${fileCount} files, tối ưu cho ${htmlCount} trang HTML.`);
