const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlPath = path.join(rootDir, 'updatte', 'Green Lantern Reading Order.html');
const jsonPath = path.join(rootDir, 'archive', 'data_backup', 'orders', 'green-lantern-reading-order.json');
const dataOrdersPath = path.join(rootDir, 'data', 'orders', 'green-lantern-reading-order.json');

const html = fs.readFileSync(htmlPath, 'utf8');
const oldJson = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')) : {};

// 1. Title
const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
const title = h2Match ? h2Match[1].replace(/<[^>]+>/g, '').trim() : (oldJson.title || 'Green Lantern');

// 2. Description
const descMatch = html.match(/<p style="text-align: justify;">([\s\S]*?)<\/p>/i);
const description = descMatch ? descMatch[1].replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim() : oldJson.description;

// 3. Meta: First Appearance, Creators, Powers
let first_appearance = '';
let creators = '';
let powers = '';

const faMatch = html.match(/<strong>First Appearance:<\/strong>\s*([^<\n\r]+)/i);
if (faMatch) first_appearance = faMatch[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const crMatch = html.match(/<strong>Creators:<\/strong>\s*([^<\n\r]+)/i);
if (crMatch) creators = crMatch[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const pwMatch = html.match(/<strong>Powers:<\/strong>\s*([^<\n\r]+)/i);
if (pwMatch) powers = pwMatch[1].replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

// 4. Counter
const counterMatch = html.match(/data-x-element-counter="([^"]*)"/i);
let counterNumber = 519;
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
console.log(`Tìm thấy ${rawLines.length} dòng issues trong file HTML.`);

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

function parseIssueLine(rawLine, sortOrder) {
  let issueType = 'ongoing';
  let isNoncanon = 0;
  let title = '';
  let year = null;
  let note = null;
  let link = null;

  // 1. Kiểm tra nếu là Event Tie-in Reading Order Link
  // Ví dụ: <strong><span style="color: #ff0000;">Read <a class="dc-class" href="http://comicbookreadingorders.com/dc/events/crisis-on-infinite-earths-reading-order/">Crisis on Infinite Earths</a> here.</span></strong>
  const eventLinkMatch = rawLine.match(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
  if (eventLinkMatch) {
    const rawHref = eventLinkMatch[1].trim();
    // Chuyển link comicbookreadingorders.com thành link nội bộ
    let internalLink = rawHref.replace(/^https?:\/\/comicbookreadingorders\.com/i, '');
    if (!internalLink.startsWith('/')) internalLink = '/' + internalLink;
    if (!internalLink.endsWith('/')) internalLink = internalLink + '/';

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

  // 2. Phân loại màu sắc
  if (rawLine.includes('#008000')) {
    issueType = 'limited';
  } else if (rawLine.includes('#ff0000')) {
    issueType = 'oneshot';
  }

  // 3. Tách note màu xanh (#0000ff) hoặc sau dấu '-'
  // Format phổ biến: <span style="color: #008000;">DC: The New Frontier #1</span> (2004) - <span style="color: #0000ff;">Alternate Universe</span>
  let cleanLine = decodeHtmlEntities(rawLine.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

  // Tách phần note sau dấu " - "
  const dashIndex = cleanLine.indexOf(' - ');
  let mainPart = cleanLine;
  if (dashIndex !== -1) {
    note = cleanLine.slice(dashIndex + 3).trim();
    mainPart = cleanLine.slice(0, dashIndex).trim();
  }

  // 4. Tách năm phát hành: (YYYY) hoặc (YYYY-YYYY)
  const yearMatch = mainPart.match(/\((\d{4}(?:-\d{4})?)\)/);
  if (yearMatch) {
    year = yearMatch[1];
    mainPart = mainPart.replace(yearMatch[0], '').trim();
  }

  title = mainPart.trim();

  return {
    sort_order: sortOrder,
    title,
    issue_type: issueType,
    year,
    note: note || null,
    is_noncanon: isNoncanon
  };
}

const parsedIssues = rawLines.map((l, idx) => parseIssueLine(l, idx + 1));

const updatedOrder = {
  ...oldJson,
  id: oldJson.id || 481,
  slug: oldJson.slug || 'green-lantern',
  direct_slug: oldJson.direct_slug || 'green-lantern-reading-order',
  title: title,
  universe_slug: oldJson.universe_slug || 'dc',
  category_slug: oldJson.category_slug || 'characters',
  category_name: oldJson.category_name || 'Nhân vật',
  url: '/dc/characters/green-lantern-reading-order/',
  description: description,
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

console.log('--- Metadata Preview ---');
console.log('Title:', updatedOrder.title);
console.log('Description:', updatedOrder.description);
console.log('First Appearance:', updatedOrder.first_appearance);
console.log('Creators:', updatedOrder.creators);
console.log('Powers:', updatedOrder.powers);
console.log('Total Issues Counter:', updatedOrder.total_issues);
console.log('Total Issues in List:', updatedOrder.issues.length);
console.log('Event links count:', updatedOrder.issues.filter(i => i.issue_type === 'event_link').length);

// Ghi file JSON vào archive/data_backup/orders/
fs.writeFileSync(jsonPath, JSON.stringify(updatedOrder, null, 2), 'utf8');
console.log(`Đã ghi thành công: ${jsonPath}`);

// Nếu thư mục data/orders/ tồn tại, ghi cả vào đó
if (fs.existsSync(path.dirname(dataOrdersPath))) {
  fs.writeFileSync(dataOrdersPath, JSON.stringify(updatedOrder, null, 2), 'utf8');
  console.log(`Đã ghi thành công: ${dataOrdersPath}`);
}
