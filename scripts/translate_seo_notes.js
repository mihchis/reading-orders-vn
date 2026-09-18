const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const excludedDirs = new Set([
  'node_modules',
  'dist',
  'archive',
  'tham_khao',
  '.git',
  'server',
  'scripts',
  'components',
  'site',
  '.system_generated'
]);

let updatedFiles = 0;
let totalScanned = 0;

const stats = {
  titleOrder: 0,
  titleList: 0,
  ogTitleOrder: 0,
  ogTitleList: 0,
  metaDesc: 0,
  ogDesc: 0,
  firstApp: 0,
  originOf: 0,
  deathOf: 0,
  returnOf: 0,
  preludeTo: 0,
  conclusionOf: 0
};

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      totalScanned++;
      const filePath = path.join(dir, entry.name);
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;

      // 1. Title tags
      content = content.replace(/<title>([^<]+?)\s+Reading Order<\/title>/gi, (match, p1) => {
        stats.titleOrder++;
        return `<title>Thứ Tự Đọc ${p1.trim()} - Comic Book Reading Orders VN</title>`;
      });

      content = content.replace(/<title>([^<]+?)\s+Reading List<\/title>/gi, (match, p1) => {
        stats.titleList++;
        return `<title>Danh Sách Đọc ${p1.trim()} - Comic Book Reading Orders VN</title>`;
      });

      // 2. OpenGraph Title
      content = content.replace(/<meta\s+property="og:title"\s+content="([^"]+?)\s+Reading Order"\s*\/>/gi, (match, p1) => {
        stats.ogTitleOrder++;
        return `<meta property="og:title" content="Thứ Tự Đọc ${p1.trim()} - Comic Book Reading Orders VN" />`;
      });

      content = content.replace(/<meta\s+property="og:title"\s+content="([^"]+?)\s+Reading List"\s*\/>/gi, (match, p1) => {
        stats.ogTitleList++;
        return `<meta property="og:title" content="Danh Sách Đọc ${p1.trim()} - Comic Book Reading Orders VN" />`;
      });

      // 3. Meta description & OpenGraph description (Yoast pattern)
      const descRegex = /content="Welcome to the ([^"]+?) Reading Order\. This reading order contains all the essential and recommended comic book issues for you to enjoy ([^"]+?)\."/gi;
      content = content.replace(descRegex, (match, p1, p2) => {
        stats.metaDesc++;
        return `content="Chào mừng bạn đến với Thứ Tự Đọc ${p1.trim()}. Danh sách tổng hợp toàn bộ các tập truyện tranh hay nhất và quan trọng nhất để bạn thưởng thức ${p1.trim()} trọn vẹn."`;
      });

      // 4. Reading notes / Comments (an toàn trong thẻ span/comment)
      content = content.replace(/First appearance of\s+/g, () => {
        stats.firstApp++;
        return 'Xuất hiện lần đầu của ';
      });

      content = content.replace(/Origin of\s+/g, () => {
        stats.originOf++;
        return 'Nguồn gốc của ';
      });

      content = content.replace(/Death of\s+/g, () => {
        stats.deathOf++;
        return 'Cái chết của ';
      });

      content = content.replace(/Return of\s+/g, () => {
        stats.returnOf++;
        return 'Sự trở lại của ';
      });

      content = content.replace(/Prelude to\s+/g, () => {
        stats.preludeTo++;
        return 'Mở đầu cho ';
      });

      content = content.replace(/Conclusion of\s+/g, () => {
        stats.conclusionOf++;
        return 'Hồi kết của ';
      });

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        updatedFiles++;
      }
    }
  }
}

console.log('🚀 Bắt đầu quá trình Việt hoá SEO Title, Meta Description và Ghi chú đọc...');
const start = Date.now();
walk(rootDir);
const duration = ((Date.now() - start) / 1000).toFixed(2);

console.log(`\n✅ Hoàn tất trong ${duration}s!`);
console.log(`📊 Tổng số file quét: ${totalScanned}`);
console.log(`✨ Số file có cập nhật: ${updatedFiles}`);
console.log('\n--- Thống kê chi tiết các thành phần SEO & Ghi chú đã Việt hoá ---');
console.log(`  - Thẻ <title> Reading Order: ${stats.titleOrder}`);
console.log(`  - Thẻ <title> Reading List: ${stats.titleList}`);
console.log(`  - Thẻ og:title Reading Order: ${stats.ogTitleOrder}`);
console.log(`  - Thẻ og:title Reading List: ${stats.ogTitleList}`);
console.log(`  - Thẻ meta description: ${stats.metaDesc}`);
console.log(`  - Ghi chú Xuất hiện lần đầu: ${stats.firstApp}`);
console.log(`  - Ghi chú Nguồn gốc: ${stats.originOf}`);
console.log(`  - Ghi chú Cái chết: ${stats.deathOf}`);
console.log(`  - Ghi chú Sự trở lại: ${stats.returnOf}`);
console.log(`  - Ghi chú Mở đầu cho: ${stats.preludeTo}`);
console.log(`  - Ghi chú Hồi kết: ${stats.conclusionOf}`);
