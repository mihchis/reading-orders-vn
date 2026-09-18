/**
 * scripts/translate_phase2_marvel.js
 * Tự động dịch và cập nhật toàn bộ 123 Nhân vật Marvel và 141 Sự kiện Marvel còn lại.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

function translateText(text) {
  return new Promise((resolve) => {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' + encodeURIComponent(text);
    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          const translated = json[0].map(s => s[0]).join('');
          resolve(translated);
        } catch (e) {
          resolve(text); // Fallback to original text if error
        }
      });
    }).on('error', () => resolve(text));
  });
}

function refineComicText(text) {
  return text
    .replace(/\bnhân vật phản diện\b/gi, 'kẻ phản diện')
    .replace(/\bđột biến\b/gi, 'dị nhân')
    .replace(/\bĐột biến\b/gi, 'Dị nhân')
    .replace(/\bNgười nhện\b/gi, 'Spider-Man')
    .replace(/\bNgười sắt\b/gi, 'Iron Man')
    .replace(/\bNgười dơi\b/gi, 'Batman')
    .replace(/\s+/g, ' ')
    .trim();
}

async function processBatch(dataFile, label) {
  if (!fs.existsSync(dataFile)) {
    console.error('File not found:', dataFile);
    return;
  }
  const items = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const keys = Object.keys(items);
  console.log(`\n=== Bắt đầu dịch ${keys.length} mục thuộc ${label} ===`);

  let successCount = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const item = items[key];
    const filePath = path.resolve(__dirname, '..', item.relPath);

    if (!fs.existsSync(filePath)) {
      console.warn(`[SKIP] Không tìm thấy file: ${filePath}`);
      continue;
    }

    try {
      const viRaw = await translateText(item.text);
      const vi = refineComicText(viRaw);

      let html = fs.readFileSync(filePath, 'utf8');

      // 1. Cập nhật Bio paragraph
      const bioMatch = html.match(/(<div class="x-text x-content[^"]*">\s*<p[^>]*>)([\s\S]*?)(<\/p>\s*<\/div>)/);
      if (bioMatch) {
        html = html.replace(bioMatch[0], `${bioMatch[1]}${vi}${bioMatch[3]}`);
      }

      // 2. Cập nhật nhãn Metadata
      html = html.replace(/<strong>Powers:<\/strong>/gi, '<strong>Năng lực:</strong>');
      html = html.replace(/<strong>Teams:<\/strong>/gi, '<strong>Đội nhóm:</strong>');
      html = html.replace(/<strong>Aliases:<\/strong>/gi, '<strong>Bí danh:</strong>');
      html = html.replace(/<strong>Year Published:<\/strong>/gi, '<strong>Năm xuất bản:</strong>');
      html = html.replace(/<strong>Featured Characters:<\/strong>/gi, '<strong>Nhân vật nổi bật:</strong>');
      html = html.replace(/<strong>Previous Event:<\/strong>/gi, '<strong>Sự kiện trước:</strong>');
      html = html.replace(/<strong>Next Event:<\/strong>/gi, '<strong>Sự kiện tiếp theo:</strong>');
      html = html.replace(/<strong>First Appearance:<\/strong>/gi, '<strong>Xuất hiện lần đầu:</strong>');
      html = html.replace(/<strong>Creators:<\/strong>/gi, '<strong>Tác giả sáng tạo:</strong>');

      // 3. Cập nhật SEO Meta Description
      const shortBio = vi.length > 155 ? vi.substring(0, 152) + '...' : vi;
      html = html.replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${shortBio.replace(/"/g, '&quot;')}"`);
      html = html.replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${shortBio.replace(/"/g, '&quot;')}"`);

      fs.writeFileSync(filePath, html, 'utf8');
      successCount++;
      if ((i + 1) % 10 === 0 || i === keys.length - 1) {
        console.log(`[${i + 1}/${keys.length}] Đã dịch: ${key}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${key}:`, err.message);
    }

    // Delay 120ms giữa các request để mượt mà
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`✅ Hoàn thành ${label}: ${successCount}/${keys.length} trang đã được việt hóa!`);
}

async function run() {
  await processBatch('scratch/marvel_chars_en.json', 'Nhân Vật Marvel (123 nhân vật)');
  await processBatch('scratch/marvel_events_en.json', 'Sự Kiện Marvel (141 sự kiện)');
  console.log('\n🎉 ĐÃ HOÀN TẤT TOÀN BỘ GIAI ĐOẠN 2 CHO VŨ TRỤ MARVEL!');
}

run().catch(console.error);
