const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(path.resolve('data/reading_orders.db'));
const dir = path.resolve('tham_khao');

const detailedFiles = [
  { slug: 'house-of-m', fileName: 'House of M Reading Order (9_17_2026 9：43：07 AM).html' },
  { slug: 'secret-wars-2015', fileName: 'Secret Wars (2015) Reading Order (9_17_2026 9：42：20 AM).html' },
  { slug: 'secret-wars-ii', fileName: 'Secret Wars II Reading Order (9_17_2026 9：42：32 AM).html' },
  { slug: 'planet-hulk', fileName: 'Planet Hulk Reading Order (9_17_2026 9：42：45 AM).html' },
  { slug: 'avengers-disassembled', fileName: 'Avengers Disassembled Reading Order (9_17_2026 9：43：18 AM).html' },
  { slug: 'crisis-on-infinite-earths', fileName: 'Crisis on Infinite Earths Reading Order (9_17_2026 9：46：02 AM).html' },
  { slug: 'aquaman-death-of-a-prince', fileName: 'Aquaman： Death of a Prince Reading Order (9_17_2026 9：46：17 AM).html' },
  { slug: 'the-boys', fileName: 'The Boys Reading Order (9_17_2026 9：48：06 AM).html' },
  { slug: 'hellboy-mignolaverse', fileName: 'Hellboy (Mignolaverse) Reading Order (9_17_2026 9：47：11 AM).html' },
  { slug: 'teenage-mutant-ninja-turtles-idw', fileName: 'Teenage Mutant Ninja Turtles (IDW) Reading Order (9_17_2026 9：46：42 AM).html' },
  { slug: 'transformers-idw', fileName: 'Transformers (IDW) Reading Order (9_17_2026 9：48：30 AM).html' },
  { slug: 'ultimate-marvel', fileName: 'Ultimate Marvel Reading Order (9_17_2026 9：38：50 AM).html' },
  { slug: 'marvel-2099', fileName: 'Marvel 2099 Reading Order (9_17_2026 9：39：07 AM).html' },
  { slug: '2099', fileName: '2099 Reading Order (9_17_2026 9：39：34 AM).html' },
  { slug: 'earth-x', fileName: 'Earth X Reading Order (9_17_2026 9：40：13 AM).html' },
  { slug: 'marvel-zombies', fileName: 'Marvel Zombies Reading Order (9_17_2026 9：40：01 AM).html' },
  { slug: 'marvel-1602', fileName: 'Marvel 1602 Reading Order (9_17_2026 9：43：30 AM).html' },
  { slug: 'mc2', fileName: 'MC2 Reading Order (9_17_2026 9：39：50 AM).html' },
  { slug: 'spider-women', fileName: 'Spider-Women Reading Order (9_17_2026 9：42：02 AM).html' },
];

const detailedSlugs = new Set(detailedFiles.map(d => d.slug));

// 1. Dọn sạch các description bịa/sinh tự động ở tất cả các reading orders không thuộc detailedFiles
const allOrders = db.prepare('SELECT id, slug, title, description FROM reading_orders').all();
let clearedCount = 0;
const clearStmt = db.prepare('UPDATE reading_orders SET description = NULL, previous_event_title = NULL, previous_event_slug = NULL, next_event_title = NULL, next_event_slug = NULL WHERE id = ?');

for (const order of allOrders) {
  if (!detailedSlugs.has(order.slug)) {
    clearStmt.run(order.id);
    clearedCount++;
  }
}
console.log(`Đã xóa bỏ hoàn toàn description tự sinh của ${clearedCount} sự kiện chưa có chi tiết.`);

// 2. Cập nhật chính xác mô tả và metadata thật cho các sự kiện có file chi tiết
const updateStmt = db.prepare(`
  UPDATE reading_orders
  SET description = ?,
      year_published = COALESCE(?, year_published),
      featured_characters = COALESCE(?, featured_characters),
      previous_event_title = ?,
      previous_event_slug = ?,
      next_event_title = ?,
      next_event_slug = ?
  WHERE slug = ?
`);

for (const item of detailedFiles) {
  const filePath = path.join(dir, item.fileName);
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');

  let desc = null;
  let year = null;
  let chars = null;
  let prevTitle = null;
  let prevSlug = null;
  let nextTitle = null;
  let nextSlug = null;

  const cols = content.match(/<div class="x-column x-sm x-1-2[^>]*>([\s\S]*?)<\/div>/gi);
  if (cols && cols.length >= 2) {
    desc = cols[0].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const metaCol = cols[1];

    const yearMatch = metaCol.match(/(?:Year Published|Publication Date)\s*[:：]\s*&?nbsp;?([^<br\n]+)/i);
    if (yearMatch) year = yearMatch[1].replace(/<[^>]+>/g, '').trim();

    const charMatch = metaCol.match(/(?:Featured Characters|Creators?)\s*[:：]\s*&?nbsp;?([^<br\n]+)/i);
    if (charMatch) chars = charMatch[1].replace(/<[^>]+>/g, '').trim();

    const prevMatch = metaCol.match(/Previous Event\s*[:：]\s*&?nbsp;?<a href=([^\s>]+)[^>]*>([^<]+)<\/a>/i);
    if (prevMatch) {
      prevTitle = prevMatch[2].trim();
      const slugMatch = prevMatch[1].replace(/['"]/g, '').match(/\/([^/]+)\/?$/);
      if (slugMatch) prevSlug = slugMatch[1].replace(/-reading-order$/, '');
    }

    const nextMatch = metaCol.match(/Next Event\s*[:：]\s*&?nbsp;?<a href=([^\s>]+)[^>]*>([^<]+)<\/a>/i);
    if (nextMatch) {
      nextTitle = nextMatch[2].trim();
      const slugMatch = nextMatch[1].replace(/['"]/g, '').match(/\/([^/]+)\/?$/);
      if (slugMatch) nextSlug = slugMatch[1].replace(/-reading-order$/, '');
    }
  }

  updateStmt.run(desc || null, year, chars, prevTitle, prevSlug, nextTitle, nextSlug, item.slug);
  console.log(`✓ Đã nạp metadata THẬT cho [${item.slug}]`);
}
