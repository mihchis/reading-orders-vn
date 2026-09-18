const fs = require('fs');

const testPages = [
  'marvel/characters/iron-man-reading-order/index.html',
  'marvel/characters/carnage-reading-order/index.html',
  'marvel/events/civil-war-ii-reading-order/index.html',
  'dc/characters/cyborg-reading-order/index.html',
  'dc/events/convergence-reading-order/index.html',
  'dc/dc-master-reading-order-part-1/index.html',
  'other/spawn-reading-order/index.html',
  'other/doctor-who-idw-reading-order/index.html'
];

testPages.forEach(p => {
  const html = fs.readFileSync(p, 'utf8');
  const m = html.match(/<div[^>]*class="[^"]*x-text[^"]*"[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/);
  const bio = m ? m[1].replace(/<[^>]+>/g, '').trim() : 'NOT FOUND';
  console.log('=== ' + p + ' ===');
  console.log('Bio preview:', bio.slice(0, 110) + '...\n');
});
