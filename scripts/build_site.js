const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const siteDir = path.join(rootDir, 'site');
const distDir = path.join(rootDir, 'dist');

console.log('🚀 Đang chuẩn bị bản build từ thư mục site/...');
const startTime = Date.now();

// 1. Tạo mới thư mục dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 2. Hàm copy đệ quy và chèn addon vào HTML
let htmlCount = 0;
let fileCount = 0;

const addonTags = `\n<!-- Reading Orders VN Enhancements -->\n<link rel="stylesheet" href="/assets/addon.css">\n<script src="/assets/addon.js" defer></script>\n`;

function processDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      processDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      fileCount++;
      if (entry.name.endsWith('.html')) {
        htmlCount++;
        let content = fs.readFileSync(srcPath, 'utf8');
        // Sanitize Mixed Content & insecure URLs
        content = content.replace(/http:\/\/fonts\.googleapis\.com/g, 'https://fonts.googleapis.com');
        content = content.replace(/http:\/\/www\.googletagmanager\.com/g, 'https://www.googletagmanager.com');
        content = content.replace(/http:\/\/schema\.org/g, 'https://schema.org');

        // Replace broken recaptcha script (apic353.js) with safe stub
        const safeRecaptcha = '<script id="google-recaptcha-js">window.grecaptcha=window.grecaptcha||{ready:function(cb){if(typeof cb==="function")try{cb()}catch(e){}},execute:function(){return Promise.resolve("")}};</script>';
        content = content.replace(/<script id=["']google-recaptcha-js["'][^>]*apic353\.js[^>]*><\/script>/gi, safeRecaptcha);
        content = content.replace(/<script[^>]*src=["'][^"']*apic353\.js[^"']*["'][^>]*><\/script>/gi, safeRecaptcha);

        if (!content.includes('/assets/addon.css')) {
          if (content.includes('</head>')) {
            content = content.replace('</head>', `${addonTags}</head>`);
          } else {
            content = `${addonTags}${content}`;
          }
        }
        fs.writeFileSync(destPath, content, 'utf8');
      } else {
        // Copy các file tĩnh (css, js, jpg, png, svg, json, woff2...)
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Chạy xử lý từ site sang dist
processDirectory(siteDir, distDir);

// 3. Đảm bảo search_index.json có mặt trong dist
const searchIndexSrc = path.join(siteDir, 'search_index.json');
const searchIndexDest = path.join(distDir, 'search_index.json');
if (fs.existsSync(searchIndexSrc) && !fs.existsSync(searchIndexDest)) {
  fs.copyFileSync(searchIndexSrc, searchIndexDest);
}

// 4. Tạo các trang alias/redirect tại gốc cho toàn bộ 609 reading orders
// Giúp truy cập trực tiếp /the-boys-reading-order hay /house-of-m-reading-order tự động chuyển hướng đúng, không bị 404
if (fs.existsSync(searchIndexSrc)) {
  try {
    const items = JSON.parse(fs.readFileSync(searchIndexSrc, 'utf8'));
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
console.log(`📊 Đã copy ${fileCount} files, tối ưu & chèn addon cho ${htmlCount} trang HTML.`);
