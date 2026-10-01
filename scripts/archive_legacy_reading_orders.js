const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const ordersDir = path.join(rootDir, 'data', 'orders');
const archiveDir = path.join(rootDir, 'archive', 'legacy_html');

console.log('📦 Bắt đầu di chuyển 609 thư mục HTML tĩnh cũ vào archive/legacy_html/ ...');

if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

const orderFiles = fs.readdirSync(ordersDir).filter(f => f.endsWith('.json'));
const reserved = new Set([
  'marvel', 'marvel/events', 'marvel/characters',
  'dc', 'dc/events', 'dc/characters',
  'other', 'other/events', 'other/characters',
  'index.html', 'admin', 'assets', 'updates', 'faq', 'contact'
]);

let movedCount = 0;
let errorCount = 0;

for (const file of orderFiles) {
  try {
    const raw = fs.readFileSync(path.join(ordersDir, file), 'utf8');
    const d = JSON.parse(raw);
    let url = d.url || '';
    if (!url && d.universe_slug && (d.direct_slug || d.slug)) {
      url = '/' + d.universe_slug + '/' + (d.category_slug ? d.category_slug + '/' : '') + (d.direct_slug || d.slug) + '/';
    }

    const relPath = url.replace(/^\//, '').replace(/\/+$/, '');
    if (!relPath || reserved.has(relPath)) continue;

    const srcDir = path.join(rootDir, relPath);
    if (!fs.existsSync(srcDir)) continue;

    const destDir = path.join(archiveDir, relPath);
    const destParent = path.dirname(destDir);
    if (!fs.existsSync(destParent)) {
      fs.mkdirSync(destParent, { recursive: true });
    }

    // Nếu đích đã tồn tại, xóa trước khi move
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }

    // Di chuyển thư mục
    try {
      fs.renameSync(srcDir, destDir);
    } catch (e) {
      // Fallback nếu rename qua phân vùng hoặc bị lock nhẹ
      fs.cpSync(srcDir, destDir, { recursive: true });
      fs.rmSync(srcDir, { recursive: true, force: true });
    }

    movedCount++;
  } catch (err) {
    console.error(`Lỗi khi di chuyển ${file}:`, err.message);
    errorCount++;
  }
}

console.log(`✅ Đã di chuyển thành công ${movedCount} thư mục reading order vào ${archiveDir}!`);
if (errorCount > 0) {
  console.log(`⚠️ Có ${errorCount} lỗi xảy ra.`);
}
