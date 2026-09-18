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

// Danh sách các cặp thay thế có chủ đích (chính xác từng ký tự)
const replacements = [
  // 1. Ngôn ngữ trang & OpenGraph
  { regex: /<html\s+class="no-js"\s+lang="en-US">/gi, repl: '<html class="no-js" lang="vi">', name: 'HTML lang="vi"' },
  { regex: /<html\s+lang="en-US">/gi, repl: '<html lang="vi">', name: 'HTML lang="vi"' },
  { regex: /<meta\s+property="og:locale"\s+content="en_US"\s*\/>/gi, repl: '<meta property="og:locale" content="vi_VN" />', name: 'og:locale vi_VN' },

  // 2. Breadcrumbs
  { regex: /<span class="visually-hidden">Home<\/span>/g, repl: '<span class="visually-hidden">Trang chủ</span>', name: 'Breadcrumb Trang chủ' },
  { regex: /title="You Are Here"/g, repl: 'title="Bạn đang ở đây"', name: 'Breadcrumb Bạn đang ở đây' },
  { regex: />Marvel Characters<\/span>/g, repl: '>Nhân Vật Marvel</span>', name: 'Breadcrumb Nhân Vật Marvel' },
  { regex: />Marvel Events<\/span>/g, repl: '>Sự Kiện Marvel</span>', name: 'Breadcrumb Sự Kiện Marvel' },
  { regex: />DC Characters<\/span>/g, repl: '>Nhân Vật DC</span>', name: 'Breadcrumb Nhân Vật DC' },
  { regex: />DC Events<\/span>/g, repl: '>Sự Kiện DC</span>', name: 'Breadcrumb Sự Kiện DC' },
  { regex: />Marvel Master Reading Order<\/span>/g, repl: '>Master Reading Order (Tổng Thể)</span>', name: 'Breadcrumb Marvel Master Order' },
  { regex: />DC Master Reading Order<\/span>/g, repl: '>Master Reading Order (Tổng Thể)</span>', name: 'Breadcrumb DC Master Order' },

  // 3. Legend chú giải loại truyện
  { regex: />Ongoing Series<\/p>/g, repl: '>Bộ truyện dài kỳ</p>', name: 'Legend Bộ truyện dài kỳ' },
  { regex: />Limited Series<\/span>/g, repl: '>Bộ truyện ngắn kỳ</span>', name: 'Legend Bộ truyện ngắn kỳ' },
  { regex: />One-Shots<\/span>/g, repl: '>Tập đơn (One-Shot)</span>', name: 'Legend Tập đơn' },
  { regex: />Comments<\/span>/g, repl: '>Ghi chú đọc</span>', name: 'Legend Ghi chú đọc' },

  // 4. Bộ đếm & Tabs
  { regex: /<div class="x-counter-after">ISSUES<\/div>/g, repl: '<div class="x-counter-after">TẬP TRUYỆN</div>', name: 'Bộ đếm TẬP TRUYỆN' },
  { regex: /><span>Single Issues<\/span></g, repl: '><span>Từng tập truyện</span><', name: 'Tab Từng tập truyện' },
  { regex: /><span>Trade Paperbacks<\/span></g, repl: '><span>Tuyển tập (TPB)</span><', name: 'Tab Tuyển tập TPB' },
  { regex: /><span>Collected Editions<\/span></g, repl: '><span>Tuyển tập</span><', name: 'Tab Tuyển tập' },

  // 5. Metadata nhân vật / sự kiện
  { regex: /<strong>First Appearance:<\/strong>/gi, repl: '<strong>Xuất hiện lần đầu:</strong>', name: 'Metadata Xuất hiện lần đầu' },
  { regex: /<strong>Creators:<\/strong>/gi, repl: '<strong>Tác giả sáng tạo:</strong>', name: 'Metadata Tác giả sáng tạo' },
  { regex: /<strong>Members:<\/strong>/gi, repl: '<strong>Thành viên:</strong>', name: 'Metadata Thành viên' },
  { regex: /<strong>Real Name:<\/strong>/gi, repl: '<strong>Tên thật:</strong>', name: 'Metadata Tên thật' },
  { regex: /<strong>Aliases:<\/strong>/gi, repl: '<strong>Bí danh:</strong>', name: 'Metadata Bí danh' },
  { regex: /<strong>Status:<\/strong>/gi, repl: '<strong>Tình trạng:</strong>', name: 'Metadata Tình trạng' },

  // 6. Tiêu đề phân đoạn Part 1, Part 2...
  { regex: />Part\s+(\d+)(:|\s*-)/g, repl: '>Phần $1$2', name: 'Phân đoạn Phần X' }
];

let totalScanned = 0;
let totalUpdated = 0;
const statMap = {};
replacements.forEach(r => statMap[r.name] = 0);

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

      for (const item of replacements) {
        const matches = content.match(item.regex);
        if (matches) {
          statMap[item.name] += matches.length;
          content = content.replace(item.regex, item.repl);
        }
      }

      if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        totalUpdated++;
      }
    }
  }
}

console.log('🚀 Bắt đầu quá trình Việt hoá Khung Giao diện & Breadcrumbs trên toàn bộ website...');
const start = Date.now();
walk(rootDir);
const duration = ((Date.now() - start) / 1000).toFixed(2);

console.log(`\n✅ Hoàn tất trong ${duration}s!`);
console.log(`📊 Tổng số file quét: ${totalScanned}`);
console.log(`✨ Số file có cập nhật: ${totalUpdated}`);
console.log('\n--- Thống kê chi tiết các thành phần đã Việt hoá ---');
for (const [name, count] of Object.entries(statMap)) {
  if (count > 0) {
    console.log(`  - ${name}: đã chuyển ngữ ${count} vị trí`);
  }
}
