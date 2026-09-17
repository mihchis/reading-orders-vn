const fs = require('fs');
const path = require('path');

const sampleFile = path.resolve(__dirname, '..', 'site/marvel/events/house-of-m-reading-order/index.html');
const content = fs.readFileSync(sampleFile, 'utf8');

const idx = content.indexOf('House of M #1');
console.log('Index of House of M #1:', idx);
if (idx !== -1) {
  console.log(content.substring(idx - 200, idx + 500));
}
