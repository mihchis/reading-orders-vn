const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const archiveBase = path.join(rootDir, 'archive', 'legacy_html');

const keep = new Set([
  'marvel',
  'marvel/events',
  'marvel/characters',
  'dc',
  'dc/events',
  'dc/characters',
  'other',
  'other/feed'
]);

let toMove = [];

function scan(dir) {
  const items = fs.readdirSync(path.join(rootDir, dir), { withFileTypes: true });
  for (const item of items) {
    if (!item.isDirectory()) continue;
    const rel = path.join(dir, item.name).replace(/\\/g, '/');
    if (keep.has(rel)) {
      scan(rel);
    } else {
      toMove.push(rel);
    }
  }
}

scan('marvel');
scan('dc');
scan('other');

console.log(`📦 Bắt đầu di chuyển ${toMove.length} thư mục HTML tĩnh cũ sang archive/legacy_html/...`);

let movedCount = 0;
for (const rel of toMove) {
  const src = path.join(rootDir, rel);
  const dest = path.join(archiveBase, rel);
  const destParent = path.dirname(dest);

  if (!fs.existsSync(destParent)) {
    fs.mkdirSync(destParent, { recursive: true });
  }

  // Di chuyển thư mục
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.renameSync(src, dest);
  movedCount++;
}

console.log(`✅ Đã di chuyển thành công ${movedCount} thư mục reading order cũ vào archive/legacy_html/!`);
