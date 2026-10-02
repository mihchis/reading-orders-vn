const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlPath = path.join(rootDir, 'updatte', 'Batman Reading Order.html');
const jsonPath = path.join(rootDir, 'archive', 'data_backup', 'orders', 'batman-reading-order.json');
const catalogPath = path.join(rootDir, 'data', 'catalog.json');

const html = fs.readFileSync(htmlPath, 'utf8');
const oldJson = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')) : {};

// 1. Title
const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
const title = h2Match ? h2Match[1].replace(/<[^>]+>/g, '').trim() : (oldJson.title || 'Batman');

// 2. Description - Việt hóa chuẩn văn phong siêu anh hùng
const descriptionVi = 'Batman là người bảo hộ thành phố Gotham, một người đàn ông khoác lên mình bộ trang phục loài dơi để chiến đấu chống lại cái ác và gieo rắc nỗi kinh hoàng vào tâm trí tội phạm khắp nơi. Danh tính bí mật của anh là Bruce Wayne – tỷ phú công nghiệp kiêm tay chơi khét tiếng. Dù không sở hữu siêu năng lực thần thánh nào, anh vẫn là một trong những bộ óc thông minh nhất và là chiến binh cận chiến vĩ đại nhất thế giới.';

// 3. Meta: First Appearance, Creators, Powers
let first_appearance = 'Detective Comics #27 (1939)';
let creators = 'Bill Finger, Bob Kane';
let powers = 'Ý chí kiên định (Indomitable Will), Thể chất đỉnh cao con người (Peak Human Conditioning), Bậc thầy võ thuật (Master Martial Artist), Kỹ năng nhào lộn & thiện xạ (Acrobat & Marksman), Chuyên gia thẩm vấn (Expert Interrogator), Trí tuệ cấp độ thiên tài (Genius-Level Intellect)';

const faMatch = html.match(/<strong>First Appearance<\/strong>:\s*([^<\n\r]+)/i);
if (faMatch) first_appearance = faMatch[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const crMatch = html.match(/<strong>Creators<\/strong>:\s*([^<\n\r]+)/i);
if (crMatch) creators = crMatch[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// 4. Counter
const counterMatch = html.match(/data-x-element-counter="([^"]*)"/i);
let counterNumber = 1156;
if (counterMatch) {
  try {
    const parsed = JSON.parse(counterMatch[1].replace(/&quot;/g, '"'));
    if (parsed.to) counterNumber = parseInt(parsed.to, 10);
  } catch (e) {}
}

// 5. Panel Issues
const panelRegex = /<div id="panel-[^"]*"[^>]*role="tabpanel"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i;
const panelMatch = html.match(panelRegex);
if (!panelMatch) {
  console.error('Không tìm thấy panel tabpanel!');
  process.exit(1);
}

const panelHtml = panelMatch[1];
const innerMatch = panelHtml.match(/<div class="x-text x-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
const content = innerMatch ? innerMatch[1] : panelHtml;

// Tách dòng
const normalized = content
  .replace(/<\/p>/gi, '\n')
  .replace(/<p[^>]*>/gi, '')
  .replace(/<br\s*\/?>/gi, '\n');

const rawLines = normalized.split('\n').map(l => l.trim()).filter(l => l.length > 0);
console.log(`Tìm thấy ${rawLines.length} dòng issues trong file HTML Batman.`);

function decodeHtmlEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ');
}

// Hàm Việt hóa toàn bộ các ghi chú của Batman
function translateBatmanNote(note) {
  if (!note) return null;
  const trimmed = note.trim();

  // Bảng tra cứu dịch chính xác
  const map = {
    'First appearance of Batman': 'Xuất hiện lần đầu của Batman',
    'First appearance of Joker, Catwoman': 'Xuất hiện lần đầu của Joker, Catwoman',
    'Year One.': 'Năm Đầu Tiên (Year One)',
    'Year One': 'Năm Đầu Tiên (Year One)',
    'Collects the Year One Annuals for Poison Ivy, The Riddler, Scarecrow, and Man-Bat.': 'Tuyển tập các số Annual Năm Đầu Tiên (Year One) của Poison Ivy, The Riddler, Scarecrow và Man-Bat',
    'Alternate Universe': 'Vũ trụ song song',
    'Sequel to The Long Halloween': 'Phần tiếp theo của The Long Halloween',
    'Occurs concurrently with Dark Victory.': 'Diễn ra đồng thời với Dark Victory',
    'Nightwing: Year One.': 'Nightwing: Năm Đầu Tiên (Nightwing: Year One)',
    'A Death in the Family.': 'Cái chết trong gia đình (A Death in the Family)',
    'First appearance of Azrael': 'Xuất hiện lần đầu của Azrael',
    'First appearance of Bane': 'Xuất hiện lần đầu của Bane',
    'Batman: Hush': 'Batman: Hush (Cốt truyện chính)',
    'First appearance of Damian Wayne': 'Xuất hiện lần đầu của Damian Wayne',
    'Heart of Hush.': 'Trái tim của Hush (Heart of Hush)',
    'Whatever Happened to the Caped Crusader?': 'Chuyện gì đã xảy ra với Hiệp sĩ Bóng đêm? (Whatever Happened to the Caped Crusader?)',
    'The Button': 'Chiếc Huy hiệu (The Button)'
  };

  if (map[trimmed]) return map[trimmed];

  for (const [en, vi] of Object.entries(map)) {
    if (trimmed.toLowerCase() === en.toLowerCase()) return vi;
  }

  return trimmed;
}

function parseBatmanLine(rawLine, sortOrder) {
  let issueType = 'ongoing';
  let isNoncanon = 0;
  let title = '';
  let year = null;
  let note = null;
  let link = null;
  let anchorId = null;

  // Kiểm tra nếu dòng có thẻ <a id="..."></a>
  const anchorMatch = rawLine.match(/<a\s+id="([^"]+)"[^>]*>/i);
  if (anchorMatch) {
    anchorId = anchorMatch[1];
  }

  // 1. Kiểm tra Alternate Starting Point
  // Ví dụ: <span style="color: #0000ff;"><strong>Alternate Starting Point: </strong></span> <a class="dc-class" href="#batman-404">Batman #404</a>
  if (rawLine.includes('Alternate Starting Point')) {
    const aMatch = rawLine.match(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const targetHref = aMatch ? aMatch[1].trim() : '#';
    const targetText = aMatch ? decodeHtmlEntities(aMatch[2].replace(/<[^>]+>/g, '').trim()) : 'Batman #404';

    return {
      sort_order: sortOrder,
      title: targetText,
      issue_type: 'starting_point',
      year: null,
      note: null,
      is_noncanon: 0,
      link: targetHref
    };
  }

  // 2. Kiểm tra Event Tie-in Reading Order Link
  // Ví dụ: <strong><span style="color: #ff0000;">Read <a class="dc-class" href="https://comicbookreadingorders.com/dc/events/crisis-on-infinite-earths-reading-order/">Crisis on Infinite Earths</a> here.</span></strong>
  const eventLinkMatch = rawLine.match(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  if (eventLinkMatch) {
    const rawHref = eventLinkMatch[1].trim();
    let internalLink = rawHref.replace(/^https?:\/\/comicbookreadingorders\.com/i, '');
    if (!internalLink.startsWith('/') && !internalLink.startsWith('#')) internalLink = '/' + internalLink;
    if (!internalLink.endsWith('/') && !internalLink.includes('#')) internalLink = internalLink + '/';

    const eventName = decodeHtmlEntities(eventLinkMatch[2].replace(/<[^>]+>/g, '').trim());

    return {
      sort_order: sortOrder,
      title: eventName,
      issue_type: 'event_link',
      year: null,
      note: null,
      is_noncanon: 0,
      link: internalLink
    };
  }

  // 3. Phân loại màu sắc
  if (rawLine.includes('#008000')) {
    issueType = 'limited';
  } else if (rawLine.includes('#ff0000')) {
    issueType = 'oneshot';
  }

  // 4. Tách note sau dấu '-' hoặc '–'
  let cleanLine = decodeHtmlEntities(rawLine.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

  // Chuẩn hóa dấu gạch ngang
  let dashIndex = cleanLine.indexOf(' - ');
  if (dashIndex === -1) {
    dashIndex = cleanLine.indexOf(' – ');
  }

  let mainPart = cleanLine;
  if (dashIndex !== -1) {
    note = cleanLine.slice(dashIndex + 3).trim();
    mainPart = cleanLine.slice(0, dashIndex).trim();
  }

  // 5. Tách năm phát hành: (YYYY)
  const yearMatch = mainPart.match(/\((\d{4}(?:-\d{4})?)\)/);
  if (yearMatch) {
    year = yearMatch[1];
    mainPart = mainPart.replace(yearMatch[0], '').trim();
  }

  title = mainPart.trim();

  const res = {
    sort_order: sortOrder,
    title,
    issue_type: issueType,
    year,
    note: translateBatmanNote(note),
    is_noncanon: isNoncanon
  };

  if (anchorId) {
    res.anchor_id = anchorId;
  }

  return res;
}

const parsedIssues = rawLines.map((l, idx) => parseBatmanLine(l, idx + 1));

const updatedOrder = {
  ...oldJson,
  id: oldJson.id || 451,
  slug: oldJson.slug || 'batman',
  direct_slug: oldJson.direct_slug || 'batman-reading-order',
  title: title,
  universe_slug: oldJson.universe_slug || 'dc',
  category_slug: oldJson.category_slug || 'characters',
  category_name: oldJson.category_name || 'Nhân vật',
  url: '/dc/characters/batman-reading-order/',
  description: descriptionVi,
  first_appearance: first_appearance,
  creators: creators,
  powers: powers,
  year_published: oldJson.year_published || '',
  featured_characters: oldJson.featured_characters || '',
  previous_event_title: oldJson.previous_event_title || '',
  previous_event_slug: oldJson.previous_event_slug || '',
  next_event_title: oldJson.next_event_title || '',
  next_event_slug: oldJson.next_event_slug || '',
  cover_image: oldJson.cover_image || '',
  total_issues: counterNumber,
  comic_issues_count: counterNumber,
  comments_count: oldJson.comments_count || 0,
  updated_at: new Date().toISOString(),
  issues: parsedIssues
};

console.log('--- Batman Metadata Preview (Vietnamese) ---');
console.log('Title:', updatedOrder.title);
console.log('Description:', updatedOrder.description);
console.log('First Appearance:', updatedOrder.first_appearance);
console.log('Creators:', updatedOrder.creators);
console.log('Powers:', updatedOrder.powers);
console.log('Total Issues Counter:', updatedOrder.total_issues);
console.log('Total Issues in List:', updatedOrder.issues.length);
console.log('Sample translated notes:');
updatedOrder.issues.filter(i => i.note).slice(0, 10).forEach(i => console.log(`- ${i.title}: ${i.note}`));

// Ghi file JSON vào archive/data_backup/orders/
fs.writeFileSync(jsonPath, JSON.stringify(updatedOrder, null, 2), 'utf8');
console.log(`Đã ghi thành công: ${jsonPath}`);

// Cập nhật data/catalog.json
if (fs.existsSync(catalogPath)) {
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const cIdx = catalog.findIndex(x => x.slug === 'batman' || x.slug === 'batman-reading-order');
  if (cIdx !== -1) {
    catalog[cIdx].description = descriptionVi;
    catalog[cIdx].total_issues = counterNumber;
    catalog[cIdx].comic_issues_count = counterNumber;
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
    console.log('Đã cập nhật data/catalog.json!');
  }
}
