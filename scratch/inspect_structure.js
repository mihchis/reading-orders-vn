const fs = require('fs');
const path = require('path');

const samplePath = path.join(__dirname, '../dc/characters/aquaman-reading-order/index.html');
const html = fs.readFileSync(samplePath, 'utf8');

console.log('--- File Length:', html.length);

// 1. Check between <body> and main article content
const bodyStart = html.indexOf('<body');
const mainStart = html.indexOf('role="main"');
console.log('From body to main:');
console.log(html.substring(bodyStart, bodyStart + 400));

// 2. Check all sections inside entry-content
const entryContentStart = html.indexOf('class="entry-content');
console.log('Entry content start at:', entryContentStart);

// Let's find all x-section occurrences
const sectionMatches = [];
const regex = /<div\s+class="([^"]*x-section[^"]*)"([^>]*)>/g;
let m;
while ((m = regex.exec(html)) !== null) {
  sectionMatches.push({ index: m.index, class: m[1], extra: m[2] });
}

console.log('Found sections:', sectionMatches.length);
sectionMatches.forEach((s, i) => {
  console.log(`Section ${i+1}: class="${s.class}" extra="${s.extra}"`);
  // sample snippet
  console.log('   Snippet:', html.substring(s.index, s.index + 200).replace(/\n/g, ' '));
});

// Check between end of last section and footer
const lastSection = sectionMatches[sectionMatches.length - 1];
const footerStart = html.indexOf('class="x-colophon');
console.log('After last section to footer:');
console.log(html.substring(lastSection.index + 100, lastSection.index + 600));
