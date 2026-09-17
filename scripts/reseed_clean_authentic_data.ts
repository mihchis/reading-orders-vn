import fs from 'node:fs';
import path from 'node:path';
import { db, initDatabase } from '../server/database/db';

export function reseedCleanData() {
  initDatabase();
  console.log('=== BẮT ĐẦU XỬ LÝ LÀM SẠCH VÀ CHỈ GIỮ LẠI DỮ LIỆU THẬT 100% TỪ THAM_KHAO ===');

  const thamKhaoDir = path.resolve(process.cwd(), 'tham_khao');
  const files = fs.readdirSync(thamKhaoDir);

  // 1. Xóa toàn bộ issues cũ để làm sạch triệt để dữ liệu giả mạo
  db.exec('DELETE FROM issues;');
  console.log('-> Đã xóa toàn bộ tập truyện cũ để loại bỏ hoàn toàn các tập bịa.');

  // Helper hàm bóc tách issues từ file HTML thật
  function extractRealIssues(filePath: string) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const bodyIndex = content.indexOf('<body');
    const scope = bodyIndex !== -1 ? content.substring(bodyIndex) : content;

    // Tìm khu vực chứa issues: có thể là x-tabs-panels HOẶC x-section sau h2 Reading Order
    let startIdx = scope.indexOf('x-tabs-panels');
    if (startIdx === -1) {
      const roHeader = scope.indexOf('Reading Order');
      if (roHeader !== -1) {
        startIdx = scope.indexOf('<div class="x-text', roHeader);
        if (startIdx === -1) startIdx = roHeader;
      }
    }

    if (startIdx === -1) return [];

    const snippet = scope.substring(startIdx, startIdx + 180000);
    const lines = snippet.split(/<br\s*\/?>|<\/p>|<p[^>]*>/gi);
    const issues: { title: string; issue_type: string; year?: string }[] = [];

    for (let rawLine of lines) {
      let clean = rawLine.trim();
      if (!clean || clean.includes('x-tabs') || clean.includes('Single Issues') || clean.includes('TPBs')) continue;
      if (clean.startsWith('</div>') || clean.startsWith('role=') || clean.startsWith('data-x-toggle') || clean.startsWith('<h2') || clean.startsWith('<h5')) continue;
      if (clean.includes('entry-footer') || clean.includes('x-colophon') || clean.includes('wp-admin') || clean.includes('patreon.com')) break;

      let issueType = 'ongoing';
      if (clean.includes('color:#008000') || clean.includes('color: #008000')) issueType = 'limited';
      else if (clean.includes('color:#ff0000') || clean.includes('color: #ff0000')) issueType = 'oneshot';
      else if (clean.includes('color:#0000ff') || clean.includes('color: #0000ff')) issueType = 'comment';

      let issueYear = '';
      const yearMatch = clean.match(/\((\d{4})\)/);
      if (yearMatch) issueYear = yearMatch[1];

      let titleText = clean
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/–/g, '-')
        .replace(/\s+/g, ' ')
        .trim();
      titleText = titleText.replace(/\(\d{4}\)$/, '').trim();

      // Bỏ các dòng rác hoặc tiêu đề không phải tập truyện
      if (titleText.length > 2 &&
          !titleText.startsWith('http') &&
          !titleText.startsWith('@') &&
          !titleText.includes('Copyright') &&
          !titleText.startsWith('<') &&
          !titleText.startsWith('Skip to') &&
          !titleText.includes('Click here to expand')) {
        issues.push({
          title: titleText,
          issue_type: issueType,
          year: issueYear || undefined
        });
      }
    }
    return issues;
  }

  // Danh sách các file có nội dung tập truyện thật trong tham_khao
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

  const insertIssue = db.prepare(`
    INSERT INTO issues (reading_order_id, tab_type, title, issue_type, year, note, read_url, sort_order)
    VALUES (?, 'single', ?, ?, ?, NULL, NULL, ?)
  `);

  let totalRealIssues = 0;
  for (const item of detailedFiles) {
    const filePath = path.join(thamKhaoDir, item.fileName);
    if (!fs.existsSync(filePath)) continue;

    const realIssues = extractRealIssues(filePath);
    const orderRow = db.prepare('SELECT id, title FROM reading_orders WHERE slug = ?').get(item.slug) as any;

    if (orderRow && realIssues.length > 0) {
      let idx = 1;
      for (const issue of realIssues) {
        insertIssue.run(orderRow.id, issue.title, issue.issue_type, issue.year || null, idx++);
      }
      totalRealIssues += realIssues.length;
      console.log(`✓ Đã nạp ${realIssues.length} tập truyện THẬT cho [${orderRow.title}]`);
    }
  }

  console.log(`\n=== HOÀN TẤT: ĐÃ LÀM SẠCH 100% ===`);
  console.log(`-> Tổng số tập truyện THỰC TẾ từ các file tham_khao: ${totalRealIssues} tập.`);
  console.log(`-> Tất cả các sự kiện khác giữ nguyên 0 tập, KHÔNG BỊA DATA.`);
}

reseedCleanData();
