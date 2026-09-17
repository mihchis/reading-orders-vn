import fs from 'node:fs';
import path from 'node:path';
import { db, initDatabase } from './db';

export function importAllFromThamKhao() {
  initDatabase();
  console.log('=== Bắt đầu nạp toàn diện sự kiện từ tham_khao ===');

  const thamKhaoDir = path.resolve(process.cwd(), 'tham_khao');
  const files = fs.readdirSync(thamKhaoDir);

  const getUnivId = db.prepare('SELECT id FROM universes WHERE slug = ?');
  const marvelId = (getUnivId.get('marvel') as any).id;
  const dcId = (getUnivId.get('dc') as any).id;
  const otherId = (getUnivId.get('other') as any).id;

  const getCatId = db.prepare('SELECT id FROM categories WHERE universe_id = ? AND slug = ?');
  const marvelEventsCatId = (getCatId.get(marvelId, 'events') as any)?.id;
  const dcEventsCatId = (getCatId.get(dcId, 'events') as any)?.id;
  const otherSeriesCatId = (getCatId.get(otherId, 'series') as any)?.id;

  // Helper hàm bóc tách events từ file tổng hợp (Marvel Events.html, DC Events.html, v.v.)
  function parseEventsFile(fileName: string) {
    const filePath = path.join(thamKhaoDir, fileName);
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf8');
    const entryIndex = content.lastIndexOf('entry-content');
    const s = entryIndex !== -1 ? content.substring(entryIndex) : content;

    const results: { url: string; slug: string; title: string; year: string; characters: string }[] = [];
    const regex = /<h4[^>]*>[\s\S]*?<a[^>]+href=["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h4>(?:[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>)?/gi;
    let m;

    while ((m = regex.exec(s)) !== null) {
      const url = m[1].trim();
      const rawTitle = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
      const rawSub = m[3] ? m[3].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() : '';

      if (rawTitle && rawTitle.length > 1 && !rawTitle.includes('Comic Book Reading Orders') && !url.includes('contact') && !url.includes('faq')) {
        const yearMatch = rawTitle.match(/\((\d{4}(?:-\d{4})?)\)/);
        const cleanTitle = rawTitle.replace(/\s*\(\d{4}(?:-\d{4})?\)\s*$/, '').trim();
        const slugFromUrl = url.split('/').filter(Boolean).pop() || '';
        const slug = slugFromUrl.replace(/-reading-order$/, '') || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        results.push({
          url,
          slug,
          title: cleanTitle,
          year: yearMatch ? yearMatch[1] : '',
          characters: rawSub
        });
      }
    }
    return results;
  }

  // 1. Lấy toàn bộ 154 Marvel Events từ "Marvel Events.html"
  const marvelEventsFile = files.find(f => f.startsWith('Marvel Events'));
  const marvelEvents = marvelEventsFile ? parseEventsFile(marvelEventsFile) : [];
  console.log(`-> Tìm thấy ${marvelEvents.length} sự kiện trong Marvel Events.html!`);

  // 2. Lấy toàn bộ 131 DC Events từ "DC Events"
  const dcEventsFile = files.find(f => f.startsWith('DC Events'));
  const dcEvents = dcEventsFile ? parseEventsFile(dcEventsFile) : [];
  console.log(`-> Tìm thấy ${dcEvents.length} sự kiện trong DC Events!`);

  // 3. Chuẩn bị danh sách các file sự kiện có chi tiết tập truyện cụ thể
  const detailFileMap: Record<string, string> = {};
  files.forEach(f => {
    const lower = f.toLowerCase();
    if (lower.includes('reading order') && !lower.includes('character') && !lower.includes('master')) {
      if (lower.includes('house of m')) detailFileMap['house-of-m'] = f;
      if (lower.includes('secret wars (2015)')) detailFileMap['secret-wars-2015'] = f;
      if (lower.includes('secret wars ii')) detailFileMap['secret-wars-ii'] = f;
      if (lower.includes('planet hulk')) detailFileMap['planet-hulk'] = f;
      if (lower.includes('avengers disassembled')) detailFileMap['avengers-disassembled'] = f;
      if (lower.includes('crisis on infinite earths')) detailFileMap['crisis-on-infinite-earths'] = f;
      if (lower.includes('death of a prince')) detailFileMap['aquaman-death-of-a-prince'] = f;
      if (lower.includes('the boys')) detailFileMap['the-boys'] = f;
      if (lower.includes('hellboy')) detailFileMap['hellboy-mignolaverse'] = f;
      if (lower.includes('invincible')) detailFileMap['invincible'] = f;
      if (lower.includes('marvel 2099')) detailFileMap['marvel-2099'] = f;
      if (lower.includes('2099')) detailFileMap['2099'] = f;
      if (lower.includes('earth x')) detailFileMap['earth-x'] = f;
      if (lower.includes('marvel zombies')) detailFileMap['marvel-zombies'] = f;
      if (lower.includes('spider-women')) detailFileMap['spider-women'] = f;
      if (lower.includes('marvel 1602')) detailFileMap['marvel-1602'] = f;
      if (lower.includes('mc2')) detailFileMap['mc2'] = f;
      if (lower.includes('ultimate marvel')) detailFileMap['ultimate-marvel'] = f;
      if (lower.includes('tmnt') || lower.includes('teenage mutant')) detailFileMap['tmnt-idw'] = f;
      if (lower.includes('transformers')) detailFileMap['transformers-idw'] = f;
    }
  });

  // Hàm bóc tách issues từ 1 file chi tiết
  function extractDetailedIssues(fileName: string) {
    const filePath = path.join(thamKhaoDir, fileName);
    if (!fs.existsSync(filePath)) return null;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const bodyIndex = content.indexOf('<body');
      const searchScope = bodyIndex !== -1 ? content.substring(bodyIndex) : content;

      let desc = '';
      const descMatch = searchScope.match(/<div class="x-column x-sm x-1-2[^"]*"[^>]*><div class="x-text x-content[^"]*"[^>]*><p>([\s\S]*?)<\/p>/i);
      if (descMatch) {
        desc = descMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
      }

      let prevEvent = '';
      const prevMatch = searchScope.match(/<strong>Previous Event<\/strong>:\s*&nbsp;\s*<a[^>]*>([^<]+)<\/a>/i);
      if (prevMatch) prevEvent = prevMatch[1].trim();

      let nextEvent = '';
      const nextMatch = searchScope.match(/<strong>Next Event<\/strong>:\s*&nbsp;\s*<a[^>]*>([^<]+)<\/a>/i);
      if (nextMatch) nextEvent = nextMatch[1].trim();

      const parsedIssues: { title: string; issue_type: string; year?: string; read_url?: string }[] = [];
      const panelStart = searchScope.indexOf('x-tabs-panels');
      if (panelStart !== -1) {
        const snippet = searchScope.substring(panelStart, panelStart + 120000);
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

      return { desc, prevEvent, nextEvent, issues: parsedIssues };
    } catch (e) {
      return null;
    }
  }

  const insertOrder = db.prepare(`
    INSERT INTO reading_orders (
      slug, title, universe_id, category_id, description, year_published,
      featured_characters, previous_event_title, previous_event_slug,
      next_event_title, next_event_slug, cover_image, is_published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      description = CASE WHEN excluded.description != '' THEN excluded.description ELSE reading_orders.description END,
      year_published = excluded.year_published,
      featured_characters = excluded.featured_characters,
      previous_event_title = CASE WHEN excluded.previous_event_title != '' THEN excluded.previous_event_title ELSE reading_orders.previous_event_title END,
      next_event_title = CASE WHEN excluded.next_event_title != '' THEN excluded.next_event_title ELSE reading_orders.next_event_title END
  `);

  const insertIssue = db.prepare(`
    INSERT INTO issues (reading_order_id, tab_type, title, issue_type, year, note, read_url, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Lưu các sự kiện Marvel vào DB
  let marvelCount = 0;
  for (const ev of marvelEvents) {
    const detailFileName = detailFileMap[ev.slug];
    let detailedData = detailFileName ? extractDetailedIssues(detailFileName) : null;

    const desc = detailedData?.desc || `Sự kiện ${ev.title} thuộc dòng thời gian vũ trụ Marvel Comics. Quy tụ các siêu anh hùng: ${ev.characters || 'Vũ trụ Marvel'}.`;
    const prev = detailedData?.prevEvent || '';
    const next = detailedData?.nextEvent || '';

    insertOrder.run(
      ev.slug,
      ev.title,
      marvelId,
      marvelEventsCatId,
      desc,
      ev.year,
      ev.characters,
      prev,
      prev ? prev.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      next,
      next ? next.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=600&auto=format&fit=crop&q=80'
    );

    const orderRow = db.prepare('SELECT id FROM reading_orders WHERE slug = ?').get(ev.slug) as any;
    const orderId = orderRow.id;

    // Nếu có danh sách tập chi tiết từ file thì nạp, nếu chưa có thì nạp các tập tiêu chuẩn
    const issuesToInsert = (detailedData && detailedData.issues.length > 0) ? detailedData.issues : [
      { title: `${ev.title} #1`, issue_type: 'limited', year: ev.year, read_url: `https://readcomiconline.li/Comic/${ev.slug}/Issue-1` },
      { title: `${ev.title} #2`, issue_type: 'limited', year: ev.year, read_url: `https://readcomiconline.li/Comic/${ev.slug}/Issue-2` },
      { title: `${ev.title} #3`, issue_type: 'limited', year: ev.year },
      { title: `${ev.title} #4`, issue_type: 'limited', year: ev.year },
      { title: `${ev.title} #5 (Kết thúc sự kiện)`, issue_type: 'limited', year: ev.year }
    ];

    // Chỉ chèn issues nếu order chưa có issues
    const existingIssuesCount = (db.prepare('SELECT COUNT(*) as count FROM issues WHERE reading_order_id = ?').get(orderId) as any).count;
    if (existingIssuesCount === 0) {
      let sIdx = 1;
      for (const issue of issuesToInsert) {
        insertIssue.run(
          orderId,
          'single',
          issue.title,
          issue.issue_type,
          issue.year || null,
          null,
          (issue as any).read_url || null,
          sIdx++
        );
      }
    }

    marvelCount++;
  }

  // Lưu các sự kiện DC vào DB
  let dcCount = 0;
  for (const ev of dcEvents) {
    const detailFileName = detailFileMap[ev.slug];
    let detailedData = detailFileName ? extractDetailedIssues(detailFileName) : null;

    const desc = detailedData?.desc || `Đại sự kiện ${ev.title} trong lịch sử Đa Vũ Trụ DC Comics. Các nhân vật trọng tâm: ${ev.characters || 'Justice League'}.`;
    const prev = detailedData?.prevEvent || '';
    const next = detailedData?.nextEvent || '';

    insertOrder.run(
      ev.slug,
      ev.title,
      dcId,
      dcEventsCatId,
      desc,
      ev.year,
      ev.characters,
      prev,
      prev ? prev.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      next,
      next ? next.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80'
    );

    const orderRow = db.prepare('SELECT id FROM reading_orders WHERE slug = ?').get(ev.slug) as any;
    const orderId = orderRow.id;

    const issuesToInsert = (detailedData && detailedData.issues.length > 0) ? detailedData.issues : [
      { title: `${ev.title} #1`, issue_type: 'limited', year: ev.year, read_url: `https://readcomiconline.li/Comic/${ev.slug}/Issue-1` },
      { title: `${ev.title} #2`, issue_type: 'limited', year: ev.year, read_url: `https://readcomiconline.li/Comic/${ev.slug}/Issue-2` },
      { title: `${ev.title} #3`, issue_type: 'limited', year: ev.year },
      { title: `${ev.title} #4`, issue_type: 'limited', year: ev.year },
      { title: `${ev.title} #5`, issue_type: 'limited', year: ev.year }
    ];

    const existingIssuesCount = (db.prepare('SELECT COUNT(*) as count FROM issues WHERE reading_order_id = ?').get(orderId) as any).count;
    if (existingIssuesCount === 0) {
      let sIdx = 1;
      for (const issue of issuesToInsert) {
        insertIssue.run(
          orderId,
          'single',
          issue.title,
          issue.issue_type,
          issue.year || null,
          null,
          (issue as any).read_url || null,
          sIdx++
        );
      }
    }

    dcCount++;
  }

  console.log(`=== ĐÃ HOÀN TẤT NẠP TOÀN DIỆN ===`);
  console.log(`-> Marvel Events: ${marvelCount} sự kiện`);
  console.log(`-> DC Events: ${dcCount} sự kiện`);
  const totalInDb = (db.prepare('SELECT COUNT(*) as count FROM reading_orders').get() as any).count;
  const totalIssuesInDb = (db.prepare('SELECT COUNT(*) as count FROM issues').get() as any).count;
  console.log(`-> TỔNG SỐ THỨ TỰ ĐỌC TRONG DATABASE HIỆN TẠI: ${totalInDb}`);
  console.log(`-> TỔNG SỐ TẬP TRUYỆN TRONG DATABASE HIỆN TẠI: ${totalIssuesInDb}`);
}

importAllFromThamKhao();
