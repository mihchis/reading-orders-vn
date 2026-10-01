const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const targetPages = [
  // DC Events
  { file: 'dc/events/absolute-universe-reading-order/index.html', title: 'Absolute Universe' },
  { file: 'dc/dc-all-in-reading-order/index.html', title: 'DC All In' },
  { file: 'dc/events/dc-k-o-reading-order/index.html', title: 'DC K.O.' },
  // DC Characters
  { file: 'dc/characters/clayface-reading-order/index.html', title: 'Clayface' },
  { file: 'dc/characters/cyborg-superman-reading-order/index.html', title: 'Cyborg Superman' },
  { file: 'dc/characters/peacemaker-reading-order/index.html', title: 'Peacemaker' },
  { file: 'dc/characters/reverse-flash-reading-order/index.html', title: 'Reverse-Flash' },
  { file: 'dc/characters/scarecrow-reading-order/index.html', title: 'Scarecrow' },
  { file: 'dc/characters/the-atom-reading-order/index.html', title: 'The Atom' },
  { file: 'dc/characters/the-titans-reading-order/index.html', title: 'The Titans' },
  // Marvel Events & Master
  { file: 'marvel/events/ultimate-universe-reading-order/index.html', title: 'Ultimate Universe' },
  { file: 'marvel/events/imperial-reading-order/index.html', title: 'Imperial' },
  { file: 'marvel/events/one-world-under-doom-reading-order/index.html', title: 'One World Under Doom' },
  { file: 'marvel/events/x-men-age-of-revelation-reading-order/index.html', title: 'X-Men: Age of Revelation' },
  { file: 'marvel/marvel-master-reading-order-part-15/index.html', title: 'Marvel Master Reading Order Part 15' },
  // Marvel Characters
  { file: 'marvel/characters/agatha-harkness-reading-order/index.html', title: 'Agatha Harkness' },
  { file: 'marvel/characters/hobgoblin-reading-order/index.html', title: 'Hobgoblin' },
  { file: 'marvel/characters/jeff-the-land-shark-reading-order/index.html', title: 'Jeff the Land Shark' },
  { file: 'marvel/characters/malekith-reading-order/index.html', title: 'Malekith' },
  { file: 'marvel/characters/red-skull-reading-order/index.html', title: 'Red Skull' },
  { file: 'marvel/characters/scorpion-reading-order/index.html', title: 'Scorpion' },
  { file: 'marvel/characters/the-leader-reading-order/index.html', title: 'The Leader' },
  { file: 'marvel/characters/the-mandarin-reading-order/index.html', title: 'The Mandarin' },
  { file: 'marvel/characters/winter-soldier-reading-order/index.html', title: 'Winter Soldier' },
  // Other Comics
  { file: 'other/invincible-reading-order/index.html', title: 'Invincible' },
  { file: 'other/the-massive-verse-reading-order/index.html', title: 'The Massive-Verse' }
];

function generateCleanComingSoon(title) {
  return `<div class="ro-coming-soon-card" style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; margin: 16px 0;">
  <p style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Danh Sách Thứ Tự Đọc Đang Được Cập Nhật</p>
  <p style="font-size: 14px; color: #64748b; max-width: 580px; margin: 0 auto; line-height: 1.6;">
    Danh sách thứ tự đọc chi tiết cho <strong>${title}</strong> hiện đang được ban quản trị biên tập và hệ thống hóa. Nội dung sẽ được cập nhật trong thời gian sớm nhất!
  </p>
</div>`;
}

function generateCleanTpbComingSoon() {
  return `<div class="ro-coming-soon-card" style="text-align: center; padding: 28px 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; margin: 16px 0;">
  <p style="font-size: 14px; color: #64748b; margin: 0;">Tuyển tập (TPBs) đang được cập nhật.</p>
</div>`;
}

let count = 0;
for (const item of targetPages) {
  const fullPath = path.join(rootDir, item.file);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace old panel 1 card (with emojis/gradient/etc.)
  const oldCardP1Regex = /<div class="ro-coming-soon-card"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(?=<\/div>\s*<div id="panel-[^"]*2")/i;
  // Or match any ro-coming-soon-card in panel 1
  const cleanCard1 = generateCleanComingSoon(item.title);
  const cleanCard2 = generateCleanTpbComingSoon();

  // Pattern 1: panel 1 ro-coming-soon-card
  const p1CardRegex = /<div class="ro-coming-soon-card"[^>]*>[\s\S]*?<\/div>(\s*<\/div>\s*<\/div>\s*<div id="panel-[^"]*2)/i;
  if (p1CardRegex.test(content)) {
    content = content.replace(p1CardRegex, `${cleanCard1}$1`);
  } else {
    // If inside ro-tab-content
    content = content.replace(
      /(<div id="panel-[^"]*1"[^>]*>[\s\S]*?<div class="x-text x-content[^"]*"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<div id="panel-[^"]*2)/i,
      `$1\n${cleanCard1}\n$3`
    );
  }

  // Replace panel 2 TPB card
  content = content.replace(
    /(<div id="panel-[^"]*2"[^>]*>[\s\S]*?<div class="x-text x-content[^"]*"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>)/i,
    `$1\n${cleanCard2}\n$3`
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  count++;
}

console.log(`Đã cập nhật giao diện tối giản chuẩn hệ thống cho ${count} trang Coming Soon!`);
