const fs = require('fs');
const path = require('path');

const files = [
  'dc/dc-all-in-reading-order/index.html',
  'dc/events/dc-k-o-reading-order/index.html',
  'dc/characters/clayface-reading-order/index.html',
  'dc/characters/cyborg-superman-reading-order/index.html',
  'dc/characters/peacemaker-reading-order/index.html',
  'dc/characters/reverse-flash-reading-order/index.html',
  'dc/characters/scarecrow-reading-order/index.html',
  'dc/characters/the-atom-reading-order/index.html',
  'dc/characters/the-titans-reading-order/index.html',
  'marvel/characters/agatha-harkness-reading-order/index.html',
  'marvel/characters/hobgoblin-reading-order/index.html',
  'marvel/characters/jeff-the-land-shark-reading-order/index.html',
  'marvel/characters/malekith-reading-order/index.html',
  'marvel/characters/red-skull-reading-order/index.html',
  'marvel/characters/scorpion-reading-order/index.html',
  'marvel/characters/the-leader-reading-order/index.html',
  'marvel/characters/the-mandarin-reading-order/index.html',
  'marvel/characters/winter-soldier-reading-order/index.html',
  'marvel/events/imperial-reading-order/index.html',
  'marvel/events/one-world-under-doom-reading-order/index.html',
  'marvel/events/ultimate-universe-reading-order/index.html',
  'marvel/events/x-men-age-of-revelation-reading-order/index.html',
  'marvel/marvel-master-reading-order-part-15/index.html'
];

console.log('=== DANH SÁCH 23 TRANG BỊ KHÓA PATREON CẦN MỞ ===');
files.forEach((f, idx) => {
  if (fs.existsSync(f)) {
    const c = fs.readFileSync(f, 'utf8');
    const titleMatch = c.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(/ - Reading Orders.*$/, '').replace(/ \|.*$/, '') : f;
    const counterMatch = c.match(/data-x-element-counter="[^"]*to&quot;:&quot;(\d+)&quot;/);
    const count = counterMatch ? counterMatch[1] : 'N/A';
    console.log(`${idx + 1}. [${title}] (Tập: ${count}) -> ${f}`);
  }
});
