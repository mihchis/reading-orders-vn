const fs = require('fs');
const html = fs.readFileSync('site/dc/events/flashpoint-reading-order/index.html', 'utf8');

const bodyIdx = html.indexOf('<body');
const entryIdx = html.indexOf('entry-content', bodyIdx);
console.log('Flashpoint body entry-content:', entryIdx);
if (entryIdx !== -1) {
  console.log(html.substring(entryIdx - 30, entryIdx + 500));
} else {
  console.log('Not in body! Searching for issues in body:');
  const flashIdx = html.indexOf('Flashpoint #1', bodyIdx);
  console.log('Flashpoint #1 in body at:', flashIdx);
  if (flashIdx !== -1) {
    console.log(html.substring(flashIdx - 300, flashIdx + 200));
  }
}
