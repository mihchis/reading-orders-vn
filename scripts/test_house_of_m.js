const fs = require('fs');
const html = fs.readFileSync('site/marvel/events/house-of-m-reading-order/index.html', 'utf8');

const tabPanels = [...html.matchAll(/<div[^>]*class=["'][^"']*x-tabs-panel[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi)];
console.log('Tab panels count:', tabPanels.length);
for (let i = 0; i < tabPanels.length; i++) {
  const content = tabPanels[i][1];
  console.log(`Panel #${i} length:`, content.length);
  console.log(`Panel #${i} hasBr:`, content.includes('<br'));
  console.log(`Panel #${i} hasHash:`, content.includes('#'));
  console.log(`Panel #${i} preview:`, content.substring(0, 150).replace(/\s+/g, ' '));
}
