const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const targetDirs = [
  '', // root index.html
  'admin',
  'contact',
  'dc',
  'faq',
  'marvel',
  'other',
  'updates',
  'templates'
];

function normalizeHtmlAssets(content) {
  let modified = content;

  // 1. Chuẩn hóa CSS core
  modified = modified.replace(
    /(?:href=["'][^"']*(?:integrity-light|integrity-lightb34e\.css)[^"']*["'])/gi,
    'href="/assets/css/integrity-light.css"'
  );
  modified = modified.replace(
    /(?:href=["'][^"']*(?:pro-child\.css|styleb34e\.css)[^"']*["'])/gi,
    'href="/assets/css/pro-child.css"'
  );

  // 2. Chuẩn hóa JS core
  modified = modified.replace(
    /(?:src=["'][^"']*(?:jquery\.minf43b\.js|jquery\.min\.js)[^"']*["'])/gi,
    'src="/assets/js/jquery.min.js"'
  );
  modified = modified.replace(
    /(?:src=["'][^"']*(?:jquery-migrate\.min5589\.js|jquery-migrate\.min\.js)[^"']*["'])/gi,
    'src="/assets/js/jquery-migrate.min.js"'
  );

  // 3. Chuẩn hóa Favicon & Images
  modified = modified.replace(
    /(?:(?:href|content)=["'][^"']*cbro\.circle\.01\.svg["'])/gi,
    (match) => match.startsWith('href=') ? 'href="/assets/images/cbro.circle.01.svg"' : 'content="/assets/images/cbro.circle.01.svg"'
  );
  modified = modified.replace(
    /(?:content=["'][^"']*banner\.jpg["'])/gi,
    'content="/assets/images/banner.jpg"'
  );
  modified = modified.replace(
    /(?:src=["'][^"']*main\.header\.svg["'])/gi,
    'src="/assets/images/main.header.svg"'
  );

  // 4. Chuẩn hóa các đường dẫn CSS/JS sang root-relative /assets/
  modified = modified.replace(/href=["'](?:\.\.\/|\.\.\/\.\.\/|\/)?assets\/css\//gi, 'href="/assets/css/');
  modified = modified.replace(/src=["'](?:\.\.\/|\.\.\/\.\.\/|\/)?assets\/js\//gi, 'src="/assets/js/');
  modified = modified.replace(/href=["'](?:\.\.\/|\.\.\/\.\.\/|\/)?assets\/images\//gi, 'href="/assets/images/');
  modified = modified.replace(/src=["'](?:\.\.\/|\.\.\/\.\.\/|\/)?assets\/images\//gi, 'src="/assets/images/');
  modified = modified.replace(/href=["'](?:\.\.\/|\.\.\/\.\.\/|\/)?assets\/addon\.css/gi, 'href="/assets/addon.css');
  modified = modified.replace(/src=["'](?:\.\.\/|\.\.\/\.\.\/|\/)?assets\/addon\.js/gi, 'src="/assets/addon.js');

  // 5. Chuẩn hóa các link nội bộ
  modified = modified.replace(/href=["'](?:\.\.\/|\.\.\/\.\.\/)?feed\/index\.html["']/gi, 'href="/feed/index.html"');
  modified = modified.replace(/href=["'](?:\.\.\/|\.\.\/\.\.\/)?comments\/feed\/index\.html["']/gi, 'href="/comments/feed/index.html"');
  modified = modified.replace(/href=["']marvel\/index\.html["']/gi, 'href="/marvel/"');
  modified = modified.replace(/href=["']dc\/index\.html["']/gi, 'href="/dc/"');
  modified = modified.replace(/href=["']updates\/index\.html["']/gi, 'href="/updates/"');
  modified = modified.replace(/href=["']faq\/index\.html["']/gi, 'href="/faq/"');
  modified = modified.replace(/href=["']contact\/index\.html["']/gi, 'href="/contact/"');
  modified = modified.replace(/href=["']other\/index\.html["']/gi, 'href="/other/"');
  modified = modified.replace(/href=["'](marvel|dc|other)\/([^"']+)\/index\.html["']/gi, 'href="/$1/$2/"');

  // 6. Xóa các thẻ link wp-json thừa không tồn tại
  modified = modified.replace(/<link rel="https:\/\/api\.w\.org\/"[^>]*>/gi, '');
  modified = modified.replace(/<link rel="alternate" title="JSON" type="application\/json"[^>]*>/gi, '');
  modified = modified.replace(/<link rel="alternate" title="oEmbed[^>]*>/gi, '');

  return modified;
}

let fixedCount = 0;

function processFile(filePath) {
  if (!filePath.endsWith('.html')) return;
  const original = fs.readFileSync(filePath, 'utf8');
  const normalized = normalizeHtmlAssets(original);
  if (normalized !== original) {
    fs.writeFileSync(filePath, normalized, 'utf8');
    fixedCount++;
    console.log(`✨ Đã sửa: ${path.relative(rootDir, filePath)}`);
  }
}

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', 'archive', 'tham_khao', '.git', '.vercel'].includes(entry.name)) {
        scanDir(fullPath);
      }
    } else if (entry.isFile()) {
      processFile(fullPath);
    }
  }
}

console.log('🔍 Bắt đầu chuẩn hóa toàn bộ đường dẫn tĩnh (CSS, JS, Fonts, Images, Links)...');
for (const sub of targetDirs) {
  const target = path.join(rootDir, sub);
  if (sub === '') {
    processFile(path.join(rootDir, 'index.html'));
  } else {
    scanDir(target);
  }
}

console.log(`✅ Hoàn thành! Đã sửa ${fixedCount} files HTML.`);

module.exports = { normalizeHtmlAssets };
