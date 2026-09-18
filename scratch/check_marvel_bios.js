const fs = require('fs');
const path = require('path');

const dirs = fs.readdirSync('marvel/characters');
const englishChars = [];

dirs.forEach(d => {
  const p = path.join('marvel/characters', d, 'index.html');
  if (fs.existsSync(p)) {
    const html = fs.readFileSync(p, 'utf8');
    const m = html.match(/<div class="x-text x-content[^"]*">\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/);
    if (m) {
      const text = m[1].replace(/<[^>]+>/g, '').trim();
      if (text.includes(' is ') || text.includes(' was ') || text.includes(' the ') || text.includes(' and ')) {
        englishChars.push({ dir: d, text: text.slice(0, 100) });
      }
    }
  }
});

const eventDirs = fs.readdirSync('marvel/events');
const englishEvents = [];

eventDirs.forEach(d => {
  const p = path.join('marvel/events', d, 'index.html');
  if (fs.existsSync(p)) {
    const html = fs.readFileSync(p, 'utf8');
    const m = html.match(/<div class="x-text x-content[^"]*">\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/);
    if (m) {
      const text = m[1].replace(/<[^>]+>/g, '').trim();
      if (text.includes(' is ') || text.includes(' was ') || text.includes(' the ') || text.includes(' and ')) {
        englishEvents.push({ dir: d, text: text.slice(0, 100) });
      }
    }
  }
});

console.log('Marvel events still in English:', englishEvents.length);
console.log('Sample 10:');
console.log(englishEvents.slice(0, 10));
