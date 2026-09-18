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
  'admin',
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

// Nạp các components dùng chung
const componentsDir = path.join(rootDir, 'components');
const headerNavComponentPath = path.join(componentsDir, 'header-nav.html');
const footerComponentPath = path.join(componentsDir, 'footer.html');
const overlaysComponentPath = path.join(componentsDir, 'overlays.html');
const footerScriptsComponentPath = path.join(componentsDir, 'footer-scripts.html');

const readingLegendComponentPath = path.join(componentsDir, 'reading-legend.html');

const sharedHeaderNav = fs.existsSync(headerNavComponentPath) ? fs.readFileSync(headerNavComponentPath, 'utf8').trim() : '';
const sharedFooter = fs.existsSync(footerComponentPath) ? fs.readFileSync(footerComponentPath, 'utf8').trim() : '';
const sharedOverlays = fs.existsSync(overlaysComponentPath) ? fs.readFileSync(overlaysComponentPath, 'utf8').trim() : '';
const sharedFooterScripts = fs.existsSync(footerScriptsComponentPath) ? fs.readFileSync(footerScriptsComponentPath, 'utf8').trim() : '';
const sharedReadingLegend = fs.existsSync(readingLegendComponentPath) ? fs.readFileSync(readingLegendComponentPath, 'utf8').trim() : '';

const headerNavRegex = /<div class="x-logobar">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i;
const footerRegex = /<footer class="x-colophon"[\s\S]*?<\/footer>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/footer>/i;
const overlaysRegex = /<div class="x-searchform-overlay">[\s\S]*?<\/div>\s*<!-- END \.x-root -->/i;
const scriptsRegex = /<script type="speculationrules">[\s\S]*?<\/body>/i;
const legendRegex = /<div class="x-section[^"]*?"[^>]*?>[\s\S]*?(?:Bộ truyện dài kỳ|Ongoing Series)[\s\S]*?(?:Ghi chú đọc|Comments)[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i;
const yoastSchemaRegex = /<script type="application\/ld\+json" class="yoast-schema-graph">[\s\S]*?<\/script>/i;
const csPageCssRegex = /<style id="cs-page-css">[\s\S]*?<\/style>/i;

let htmlCount = 0;
let fileCount = 0;

function copyAndInjectHtml(srcPath, destPath) {
  fileCount++;
  htmlCount++;
  let content = fs.readFileSync(srcPath, 'utf8');

  if (sharedHeaderNav && headerNavRegex.test(content)) {
    content = content.replace(headerNavRegex, sharedHeaderNav);
  }
  if (sharedFooter && footerRegex.test(content)) {
    content = content.replace(footerRegex, sharedFooter);
  }
  if (sharedOverlays && overlaysRegex.test(content)) {
    content = content.replace(overlaysRegex, sharedOverlays);
  }
  if (sharedFooterScripts && scriptsRegex.test(content)) {
    content = content.replace(scriptsRegex, sharedFooterScripts + '\n</body>');
  }
  if (yoastSchemaRegex.test(content)) {
    content = content.replace(yoastSchemaRegex, '');
  }
  if (csPageCssRegex.test(content)) {
    content = content.replace(csPageCssRegex, '');
  }

  fs.writeFileSync(destPath, content, 'utf8');
}

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
      if (entry.name.endsWith('.html')) {
        copyAndInjectHtml(srcPath, destPath);
      } else {
        fileCount++;
        fs.copyFileSync(srcPath, destPath);
      }
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
    if (item.endsWith('.html')) {
      copyAndInjectHtml(src, dest);
    } else {
      fileCount++;
      fs.copyFileSync(src, dest);
    }
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
