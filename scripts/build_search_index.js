const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const siteDir = rootDir;
const indexList = [];

// Quét Marvel, DC, Other
const categories = [
  { dir: 'marvel/events', universe: 'Marvel', category: 'Sự kiện' },
  { dir: 'marvel/characters', universe: 'Marvel', category: 'Nhân vật' },
  { dir: 'marvel', universe: 'Marvel', category: 'Chính / Master', isRootSub: true },
  { dir: 'dc/events', universe: 'DC', category: 'Sự kiện' },
  { dir: 'dc/characters', universe: 'DC', category: 'Nhân vật' },
  { dir: 'dc', universe: 'DC', category: 'Chính / Master', isRootSub: true },
  { dir: 'other', universe: 'Khác (Dark Horse, Image, IDW...)', category: 'Series' }
];

function extractTitleFromHtml(htmlPath) {
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : '';
    title = title.replace(/\s*\|\s*Start Reading.*$/i, '').replace(/\s*-\s*Comic Book Reading Orders.*$/i, '').replace(/\s*\|\s*Thứ Tự Đọc Truyện Tranh.*$/i, '');
    return title;
  } catch {
    return '';
  }
}

for (const cat of categories) {
  const fullCatDir = path.join(siteDir, cat.dir);
  if (!fs.existsSync(fullCatDir)) continue;

  const entries = fs.readdirSync(fullCatDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (cat.isRootSub && (entry.name === 'events' || entry.name === 'characters')) continue;

    const indexPath = path.join(fullCatDir, entry.name, 'index.html');
    if (fs.existsSync(indexPath)) {
      const pageTitle = extractTitleFromHtml(indexPath) || entry.name.replace(/-/g, ' ');
      const relUrl = '/' + path.relative(siteDir, path.join(fullCatDir, entry.name)).replace(/\\/g, '/') + '/';
      
      // Trích xuất năm nếu có trong title
      const yearMatch = pageTitle.match(/\((\d{4}(?:-\d{4})?)\)/);
      const year = yearMatch ? yearMatch[1] : '';

      indexList.push({
        id: entry.name,
        title: pageTitle,
        slug: entry.name,
        universe: cat.universe,
        category: cat.category,
        url: relUrl,
        year
      });
    }
  }
}

console.log(`Đã lập chỉ mục xong ${indexList.length} reading orders!`);

// Ghi ra site/search_index.json
const outputPath = path.join(siteDir, 'search_index.json');
fs.writeFileSync(outputPath, JSON.stringify(indexList, null, 2), 'utf8');
console.log(`Đã lưu search_index.json tại ${outputPath}`);
