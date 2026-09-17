const fs = require('fs');
const path = require('path');

const sampleFile = path.resolve(__dirname, '..', 'site/marvel/events/house-of-m-reading-order/index.html');
const content = fs.readFileSync(sampleFile, 'utf8');

const idx = content.indexOf('House of M #1');
console.log('Container surrounding House of M #1:');
console.log(content.substring(idx - 1500, idx - 800));
