const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const targetPages = [
  'dc/events/absolute-universe-reading-order/index.html',
  'dc/dc-all-in-reading-order/index.html',
  'dc/events/dc-k-o-reading-order/index.html',
  'dc/characters/clayface-reading-order/index.html',
  'dc/characters/cyborg-superman-reading-order/index.html',
  'dc/characters/peacemaker-reading-order/index.html',
  'dc/characters/reverse-flash-reading-order/index.html',
  'dc/characters/scarecrow-reading-order/index.html',
  'dc/characters/the-atom-reading-order/index.html',
  'dc/characters/the-titans-reading-order/index.html',
  'marvel/events/ultimate-universe-reading-order/index.html',
  'marvel/events/imperial-reading-order/index.html',
  'marvel/events/one-world-under-doom-reading-order/index.html',
  'marvel/events/x-men-age-of-revelation-reading-order/index.html',
  'marvel/marvel-master-reading-order-part-15/index.html',
  'marvel/characters/agatha-harkness-reading-order/index.html',
  'marvel/characters/hobgoblin-reading-order/index.html',
  'marvel/characters/jeff-the-land-shark-reading-order/index.html',
  'marvel/characters/malekith-reading-order/index.html',
  'marvel/characters/red-skull-reading-order/index.html',
  'marvel/characters/scorpion-reading-order/index.html',
  'marvel/characters/the-leader-reading-order/index.html',
  'marvel/characters/the-mandarin-reading-order/index.html',
  'marvel/characters/winter-soldier-reading-order/index.html',
  'other/invincible-reading-order/index.html',
  'other/the-massive-verse-reading-order/index.html'
];

let failed = false;

console.log('🔍 KIỂM TRA 26 TRANG COMING SOON:');
targetPages.forEach(rel => {
  const full = path.join(rootDir, rel);
  if (!fs.existsSync(full)) {
    console.error(`❌ TỆP KHÔNG TỒN TẠI: ${rel}`);
    failed = true;
    return;
  }

  const content = fs.readFileSync(full, 'utf8');

  // Kiểm tra card coming soon
  if (!content.includes('ro-coming-soon-card')) {
    console.error(`❌ THIẾU CARD COMING SOON: ${rel}`);
    failed = true;
  }

  // Kiểm tra counter = 0
  const counterMatch = content.match(/data-x-element-counter="{&quot;to&quot;:&quot;(\d+)&quot;/);
  if (!counterMatch || counterMatch[1] !== '0') {
    console.error(`❌ COUNTER KHÔNG PHẢI 0: ${rel} (counter=${counterMatch ? counterMatch[1] : 'null'})`);
    failed = true;
  }

  // Kiểm tra không còn text sai lệch
  if (content.includes('Nội dung miễn phí — Xem tự do không giới hạn!')) {
    console.error(`❌ CÒN TEXT SAI LỆCH 'Nội dung miễn phí': ${rel}`);
    failed = true;
  }
  if (/This reading order is a Patreon exclusive/i.test(content) || /The reading order is a Patreon exclusive/i.test(content)) {
    console.error(`❌ CÒN TEXT PATREON EXCLUSIVE: ${rel}`);
    failed = true;
  }

  // Riêng Absolute Universe và Ultimate Universe: không được còn danh sách tập chế
  if (rel.includes('absolute-universe') && content.includes('Absolute Batman #1')) {
    console.error(`❌ CÒN DỮ LIỆU CHẾ TRONG ABSOLUTE UNIVERSE!`);
    failed = true;
  }
  if (rel.includes('ultimate-universe') && content.includes('Ultimate Invasion #1–4')) {
    console.error(`❌ CÒN DỮ LIỆU CHẾ TRONG ULTIMATE UNIVERSE!`);
    failed = true;
  }
  if (rel.includes('invincible') && content.includes('Tech Jacket #1')) {
    console.error(`❌ CÒN DỮ LIỆU TẬP TRUYỆN TRONG INVINCIBLE!`);
    failed = true;
  }
});

// Kiểm tra các file JSON trong data/orders
console.log('🔍 KIỂM TRA DỮ LIỆU JSON (data/orders):');
targetPages.forEach(rel => {
  const slug = path.basename(path.dirname(rel));
  let jsonPath = path.join(rootDir, 'data/orders', `${slug}.json`);
  if (!fs.existsSync(jsonPath)) {
    jsonPath = path.join(rootDir, 'data/orders', `${slug}-reading-order.json`);
  }
  if (fs.existsSync(jsonPath)) {
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (json.total_issues !== 0 || json.status !== 'coming_soon' || (json.issues && json.issues.length > 0)) {
      console.error(`❌ JSON CHƯA ĐỒNG BỘ: ${path.basename(jsonPath)} (total_issues=${json.total_issues}, status=${json.status}, issues=${json.issues?.length})`);
      failed = true;
    }
  }
});

if (!failed) {
  console.log('\n🎉 TẤT CẢ 26 TRANG ĐÃ VƯỢT QUA KIỂM TRA TOÀN DIỆN 100%!');
} else {
  console.error('\n⚠️ PHÁT HIỆN LỖI TRONG QUÁ TRÌNH KIỂM TRA!');
  process.exit(1);
}
