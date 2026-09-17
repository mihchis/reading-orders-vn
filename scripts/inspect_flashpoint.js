const fs = require('fs');
const html = fs.readFileSync('site/dc/events/flashpoint-reading-order/index.html', 'utf8');

const entryIdx = html.indexOf('entry-content');
console.log('Flashpoint entry-content:');
console.log(html.substring(entryIdx, entryIdx + 1500));
