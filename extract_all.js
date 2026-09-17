const fs = require('fs');

function extractEvents(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const entryIndex = content.lastIndexOf('entry-content');
  const s = entryIndex !== -1 ? content.substring(entryIndex) : content;

  const matches = [];
  // Hỗ trợ cả unquoted và quoted href
  const regex = /<h4[^>]*>[\s\S]*?<a[^>]+href=["']?([^"'\s>]+)["']?[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h4>(?:[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>)?/gi;
  let m;
  while ((m = regex.exec(s)) !== null) {
    const url = m[1].trim();
    const rawTitle = m[2].replace(/<[^>]+>/g, '').trim();
    const rawSub = m[3] ? m[3].replace(/<[^>]+>/g, '').trim() : '';

    if (rawTitle && rawTitle.length > 1 && !rawTitle.includes('Comic Book Reading Orders') && !url.includes('contact') && !url.includes('faq')) {
      const yearMatch = rawTitle.match(/\((\d{4}(?:-\d{4})?)\)/);
      const cleanTitle = rawTitle.replace(/\s*\(\d{4}(?:-\d{4})?\)\s*$/, '').trim();
      const slug = url.split('/').filter(Boolean).pop() || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      matches.push({
        url,
        slug: slug.replace(/-reading-order$/, ''),
        title: rawTitle,
        cleanTitle,
        year: yearMatch ? yearMatch[1] : '',
        characters: rawSub
      });
    }
  }
  return matches;
}

const files = fs.readdirSync('tham_khao');
const marvelEventsFile = files.find(f => f.startsWith('Marvel Events'));
const dcEventsFile = files.find(f => f.startsWith('DC Events'));
const marvelCharsFile = files.find(f => f.startsWith('Marvel Characters'));
const dcCharsFile = files.find(f => f.startsWith('DC Character Reading Orders'));
const otherComicsFile = files.find(f => f.startsWith('Other'));

const marvelEvents = extractEvents('tham_khao/' + marvelEventsFile);
const dcEvents = extractEvents('tham_khao/' + dcEventsFile);
const marvelChars = extractEvents('tham_khao/' + marvelCharsFile);
const dcChars = extractEvents('tham_khao/' + dcCharsFile);
const otherComics = extractEvents('tham_khao/' + otherComicsFile);

console.log('Marvel Events:', marvelEvents.length);
console.log('DC Events:', dcEvents.length);
console.log('Marvel Characters:', marvelChars.length);
console.log('DC Characters:', dcChars.length);
console.log('Other Comics:', otherComics.length);
