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

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`✅ Build hoàn tất trong ${duration}s!`);
console.log(`📊 Đã copy ${fileCount} files, tối ưu & chèn addon cho ${htmlCount} trang HTML.`);
