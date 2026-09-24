const fs = require('fs');

const pages = [
  'marvel/events/index.html',
  'dc/events/index.html',
  'marvel/characters/index.html',
  'dc/characters/index.html',
  'marvel/index.html',
  'dc/index.html',
  'other/index.html',
  'marvel/event-timeline/index.html',
  'dc/event-timeline/index.html',
  'faq/index.html',
  'contact/index.html',
  'updates/index.html',
  'marvel/marvel-master-reading-order/index.html',
  'dc/dc-master-reading-order/index.html'
];

for (const p of pages) {
  if (!fs.existsSync(p)) continue;
  const content = fs.readFileSync(p, 'utf8');
  console.log(`\n=================== ${p} ===================`);
  
  const titleMatch = content.match(/<h2[^>]*class="[^"]*h-custom-headline[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
  if (titleMatch) {
    console.log('Title:', titleMatch[1].replace(/<[^>]+>/g, '').trim());
  }

  const pMatches = content.match(/<p style="text-align: justify;">([\s\S]*?)<\/p>/gi)
    || content.match(/<div class="x-text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
  if (pMatches) {
    pMatches.slice(0, 3).forEach((m, idx) => {
      console.log(`P${idx + 1}:`, m.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200));
    });
  }

  const alertMatch = content.match(/<div class="x-alert[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (alertMatch) {
    console.log('Alert:', alertMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  }
}
