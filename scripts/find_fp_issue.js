const fs = require('fs');
const html = fs.readFileSync('site/dc/events/flashpoint-reading-order/index.html', 'utf8');

const fpIdx = html.indexOf('Flashpoint #1');
console.log('Flashpoint #1 in html at:', fpIdx);
if (fpIdx !== -1) {
  console.log(html.substring(fpIdx - 200, fpIdx + 300));
}
