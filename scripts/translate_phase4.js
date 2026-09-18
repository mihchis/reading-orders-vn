/**
 * scripts/translate_phase4.js
 * Tự động dịch và cập nhật toàn bộ 72 bộ Master Orders, Kỷ nguyên và Truyện Độc lập khác.
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
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

function refineComicText(text) {
  return text
    .replace(/\bnhân vật phản diện\b/gi, 'kẻ phản diện')
    .replace(/\bNgười nhện\b/gi, 'Spider-Man')
    .replace(/\bNgười dơi\b/gi, 'Batman')
    .replace(/\bNgười Dơi\b/gi, 'Batman')
    .replace(/\bNgười siêu nhân\b/gi, 'Superman')
    .replace(/\bNgười Siêu Nhân\b/gi, 'Superman')
    .replace(/\bSiêu nhân\b/gi, 'Superman')
    .replace(/\bđột biến\b/gi, 'dị nhân')
    .replace(/\bĐột biến\b/gi, 'Dị nhân')
    .replace(/\s+/g, ' ')
    .trim();
}

async function run() {
  const dataFile = 'scratch/phase4_en.json';
  if (!fs.existsSync(dataFile)) {
    console.error('File not found:', dataFile);
    return;
  }
  const items = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const keys = Object.keys(items);
  console.log(`\n=== Bắt đầu dịch ${keys.length} mục thuộc Giai Đoạn 4 (Master Orders & Truyện Độc Lập) ===`);

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
      const bioMatch = html.match(/(<div[^>]*class="[^"]*x-text[^"]*"[^>]*>\s*<p[^>]*>)([\s\S]*?)(<\/p>\s*<\/div>)/);
      if (bioMatch) {
        html = html.replace(bioMatch[0], `${bioMatch[1]}${vi}${bioMatch[3]}`);
      }

      // 2. Cập nhật nhãn Metadata
      html = html.replace(/<strong>Publisher:<\/strong>/gi, '<strong>Nhà xuất bản:</strong>');
      html = html.replace(/<strong>Publication Date:<\/strong>/gi, '<strong>Thời gian xuất bản:</strong>');
      html = html.replace(/<strong>Genre:<\/strong>/gi, '<strong>Thể loại:</strong>');
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

    // Delay 120ms
    await new Promise(r => setTimeout(r, 120));
  }

  console.log(`\n🎉 ĐÃ HOÀN TẤT TOÀN BỘ GIAI ĐOẠN 4: ${successCount}/${keys.length} trang đã được việt hóa!`);
}

run().catch(console.error);
