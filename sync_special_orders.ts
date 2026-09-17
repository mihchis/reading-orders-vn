import fs from 'node:fs';
import path from 'node:path';
import { db } from './server/database/db';

const thamKhaoDir = path.resolve(process.cwd(), 'tham_khao');
const files = fs.readdirSync(thamKhaoDir);

// Danh sách các file thứ tự đọc đặc biệt
const targetFiles = [
  { key: 'ultimate-marvel', search: 'Ultimate Marvel' },
  { key: 'earth-x', search: 'Earth X' },
  { key: 'marvel-zombies', search: 'Marvel Zombies' },
  { key: 'marvel-1602', search: 'Marvel 1602' },
  { key: 'mc2', search: 'MC2' },
  { key: 'spider-women', search: 'Spider-Women' },
  { key: 'secret-wars-ii', search: 'Secret Wars II' },
  { key: 'teenage-mutant-ninja-turtles-idw', search: 'Teenage Mutant' },
  { key: 'transformers-idw', search: 'Transformers' }
];

for (const target of targetFiles) {
  const fileName = files.find(f => f.toLowerCase().includes(target.search.toLowerCase()) && f.endsWith('.html'));
  if (!fileName) {
    console.log(`Không tìm thấy file cho: ${target.search}`);
    continue;
  }

  const content = fs.readFileSync(path.join(thamKhaoDir, fileName), 'utf8');
  const bodyIndex = content.indexOf('<body');
  const scope = bodyIndex !== -1 ? content.substring(bodyIndex) : content;

  // Title
  const h1Match = scope.match(/<h1[^>]*>[\s\S]*?<span><strong>([\s\S]*?)<\/strong><\/span><\/h1>/i);
  const title = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : target.search;

  // Desc
  let desc = '';
  const descMatch = scope.match(/<div class="x-column x-sm x-1-2[^"]*"[^>]*><div class="x-text x-content[^"]*"[^>]*><p[^>]*>([\s\S]*?)<\/p>/i);
  if (descMatch) {
    desc = descMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
  }

  // Year
  let year = '';
  const yearMatch = scope.match(/<strong>Year Published<\/strong>:\s*&nbsp;\s*([^<]+)/i);
  if (yearMatch) year = yearMatch[1].trim();

  // Characters
  let chars = '';
  const charMatch = scope.match(/<strong>Featured Characters<\/strong>:\s*&nbsp;\s*([^<]+)/i);
  if (charMatch) chars = charMatch[1].replace(/&nbsp;/g, ' ').trim();

  // Prev & Next
  let prev = '';
  const prevMatch = scope.match(/<strong>Previous Event<\/strong>:\s*&nbsp;\s*<a[^>]*>([^<]+)<\/a>/i);
  if (prevMatch) prev = prevMatch[1].trim();

  let next = '';
  const nextMatch = scope.match(/<strong>Next Event<\/strong>:\s*&nbsp;\s*<a[^>]*>([^<]+)<\/a>/i);
  if (nextMatch) next = nextMatch[1].trim();

  // Issues
  const parsedIssues: { title: string; issue_type: string; year?: string }[] = [];
  const panelStart = scope.indexOf('x-tabs-panels');
  if (panelStart !== -1) {
    const snippet = scope.substring(panelStart, panelStart + 150000);
    const lines = snippet.split(/<br\s*\/?>|<\/p>|<p[^>]*>/gi);

    for (let rawLine of lines) {
      let clean = rawLine.trim();
      if (!clean || clean.includes('x-tabs') || clean.includes('Single Issues') || clean.includes('TPBs')) continue;
      if (clean.startsWith('</div>') || clean.startsWith('role=') || clean.startsWith('data-x-toggle')) continue;
      if (clean.includes('entry-footer') || clean.includes('x-colophon') || clean.includes('wp-admin')) break;

      let issueType = 'ongoing';
      if (clean.includes('color:#008000') || clean.includes('color: #008000')) issueType = 'limited';
      else if (clean.includes('color:#ff0000') || clean.includes('color: #ff0000')) issueType = 'oneshot';
      else if (clean.includes('color:#0000ff') || clean.includes('color: #0000ff')) issueType = 'comment';

      let issueYear = '';
      const issueYearMatch = clean.match(/\((\d{4})\)/);
      if (issueYearMatch) issueYear = issueYearMatch[1];

      let titleText = clean
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      titleText = titleText.replace(/\(\d{4}\)$/, '').trim();

      if (titleText.length > 2 && !titleText.startsWith('http') && !titleText.startsWith('@') && !titleText.includes('Copyright') && !titleText.startsWith('<') && !titleText.startsWith('Skip to')) {
        parsedIssues.push({
          title: titleText,
          issue_type: issueType,
          year: issueYear || undefined,
        });
      }
    }
  }

  // Cập nhật hoặc thêm vào database
  const slug = target.key;
  const isMarvel = !slug.includes('tmnt') && !slug.includes('transformers');
  const univId = isMarvel ? 1 : 3;

  db.prepare(`
    INSERT INTO reading_orders (
      slug, title, universe_id, description, year_published,
      featured_characters, previous_event_title, previous_event_slug,
      next_event_title, next_event_slug, cover_image, is_published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      year_published = excluded.year_published,
      featured_characters = excluded.featured_characters,
      previous_event_title = excluded.previous_event_title,
      next_event_title = excluded.next_event_title
  `).run(
    slug,
    title,
    univId,
    desc || `Thứ tự đọc chi tiết cho ${title}`,
    year,
    chars,
    prev,
    prev ? prev.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
    next,
    next ? next.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
    'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=600&auto=format&fit=crop&q=80'
  );

  const orderId = (db.prepare('SELECT id FROM reading_orders WHERE slug = ?').get(slug) as any).id;

  if (parsedIssues.length > 0) {
    db.prepare('DELETE FROM issues WHERE reading_order_id = ?').run(orderId);
    const insertIssue = db.prepare(`
      INSERT INTO issues (reading_order_id, tab_type, title, issue_type, year, sort_order)
      VALUES (?, 'single', ?, ?, ?, ?)
    `);
    parsedIssues.forEach((issue, idx) => {
      insertIssue.run(orderId, issue.title, issue.issue_type, issue.year || null, idx + 1);
    });
  }

  console.log(`✓ Đã nạp hoàn chỉnh [${title}] (slug: ${slug}) với ${parsedIssues.length} tập truyện.`);
}
