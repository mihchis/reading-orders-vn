const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// First restore all files from git HEAD
console.log('Restoring 25 files from git HEAD...');
execSync('git checkout HEAD -- dc/ marvel/ other/invincible-reading-order/', { cwd: rootDir });

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

function generateComingSoonHtml(title) {
  return `<div class="ro-coming-soon-card" style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; margin: 16px 0;">
  <p style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Danh Sách Thứ Tự Đọc Đang Được Cập Nhật</p>
  <p style="font-size: 14px; color: #64748b; max-width: 580px; margin: 0 auto; line-height: 1.6;">
    Danh sách thứ tự đọc chi tiết cho <strong>${title}</strong> hiện đang được ban quản trị biên tập và hệ thống hóa. Nội dung sẽ được cập nhật trong thời gian sớm nhất!
  </p>
</div>`;
}

function generateTpbComingSoonHtml() {
  return `<div class="ro-coming-soon-card" style="text-align: center; padding: 28px 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; margin: 16px 0;">
  <p style="font-size: 14px; color: #64748b; margin: 0;">Tuyển tập (TPBs) đang được cập nhật.</p>
</div>`;
}

for (const item of targetPages) {
  const fullPath = path.join(rootDir, item.file);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Counter: to = "0", TẬP TRUYỆN • ĐANG CẬP NHẬT
  content = content.replace(/data-x-element-counter="[^"]*?"/g, 'data-x-element-counter="{&quot;to&quot;:&quot;0&quot;,&quot;speed&quot;:&quot;1.5s&quot;,&quot;commaSeparatedDecimal&quot;:false}"');
  content = content.replace(/<div class="x-counter-after">[^<]*<\/div>/g, '<div class="x-counter-after">TẬP TRUYỆN • ĐANG CẬP NHẬT</div>');

  const p1Card = generateComingSoonHtml(item.title);
  const p2Card = generateTpbComingSoonHtml();

  // Case A: The 22 empty / "Nội dung miễn phí" files
  if (content.includes('Nội dung miễn phí') || content.includes('data-x-element-tabs=""') && !item.file.includes('invincible') && !item.file.includes('absolute') && !item.file.includes('ultimate') && !item.file.includes('massive')) {
    // Replace the inner text inside the single panel of x-tabs-panels
    content = content.replace(
      /(<div class="x-tabs-panels">[\s\S]*?<div class="x-text x-content [^"]*">)([\s\S]*?)(<\/div>\s*<\/div>)/i,
      `$1\n${p1Card}\n$3`
    );
  }

  // Case B: Invincible
  if (item.file.includes('invincible')) {
    // Panel 1: replace inside of <div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">
    content = content.replace(
      /(<div id="panel-reading-order-1"[^>]*>\s*<div class="x-text x-content"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<div id="panel-reading-order-2")/i,
      `$1\n${p1Card}\n$3`
    );
    // Panel 2
    content = content.replace(
      /(<div id="panel-reading-order-2"[^>]*>\s*<div class="x-text x-content"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/i,
      `$1\n${p2Card}\n$3`
    );
  }

  // Case C: Absolute Universe
  if (item.file.includes('absolute-universe')) {
    content = content.replace(
      /(<div id="panel-reading-order-1"[^>]*>\s*<div class="x-text x-content"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<div id="panel-reading-order-2")/i,
      `$1\n${p1Card}\n$3`
    );
    content = content.replace(
      /(<div id="panel-reading-order-2"[^>]*>\s*<div class="x-text x-content"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/i,
      `$1\n${p2Card}\n$3`
    );
    // Add missing closing </div> for #x-main right before <footer class="x-colophon"
    if (!content.includes('</div>\n\n  <footer class="x-colophon"')) {
      content = content.replace(/(<\/article>\s*)\n\s*(<footer class="x-colophon")/i, '$1\n  </div>\n\n  $2');
    }
  }

  // Case D: Ultimate Universe
  if (item.file.includes('ultimate-universe')) {
    // 1. Remove the 4 extra closing divs before panel 2 in original file
    content = content.replace(
      /(<div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">[\s\S]*?<\/div>)\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*(<\/div>\s*<div id="panel-reading-order-2")/i,
      '$1\n$2'
    );
    // 2. Panel 1 replace
    content = content.replace(
      /(<div id="panel-reading-order-1"[^>]*>\s*<div class="x-text x-content"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<div id="panel-reading-order-2")/i,
      `$1\n${p1Card}\n$3`
    );
    // 3. Panel 2 replace
    content = content.replace(
      /(<div id="panel-reading-order-2"[^>]*>\s*<div class="x-text x-content"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/i,
      `$1\n${p2Card}\n$3`
    );
    // 4. Restore missing wrappers around cs-content if needed
    if (content.includes('</div>  <div id="cs-content" class="cs-content">')) {
      content = content.replace(
        '</div>  <div id="cs-content" class="cs-content">',
        '</div>\n\n  </header>\n\n  <div id="x-main" class="x-main full" role="main" tabindex="-1">\n\n    <article id="post-7460" class="post-7460 page type-page status-publish hentry no-post-thumbnail">\n        \n<div class="entry-content content">\n\n  <div id="cs-content" class="cs-content">'
      );
    }
  }

  // Case E: The Massive-Verse
  if (item.file.includes('the-massive-verse')) {
    // Clean up template to match exact div balance
    // Re-check opens vs closes
    const b = content.slice(content.indexOf('<body'), content.indexOf('</body>'));
    const op = (b.match(/<div(\s|>)/gi) || []).length;
    const cl = (b.match(/<\/div>/gi) || []).length;
    if (cl > op) {
      const extraCloses = cl - op;
      for (let i = 0; i < extraCloses; i++) {
        content = content.replace(/<\/div>(\s*<\/article>)/i, '$1');
      }
    }
  }

  // Double check "Nội dung miễn phí"
  content = content.replace(/<p style="text-align: center;"><strong><span style="color: #0000ff;">Nội dung miễn phí[^<]*<\/span><\/strong><\/p>\s*<p><\/p>/gi, '');

  fs.writeFileSync(fullPath, content, 'utf8');

  // Verify div balance
  const body = content.slice(content.indexOf('<body'), content.indexOf('</body>'));
  const opens = (body.match(/<div(\s|>)/gi) || []).length;
  const closes = (body.match(/<\/div>/gi) || []).length;
  const diff = opens - closes;
  if (diff !== 0) {
    console.error(`[ERROR] ${item.file} has div balance diff: ${diff} (opens: ${opens}, closes: ${closes})`);
  } else {
    console.log(`[OK] ${item.file} -> div balance: 0`);
  }
}
