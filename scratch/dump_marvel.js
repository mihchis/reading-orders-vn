const fs = require('fs');
const path = require('path');

function dumpBios(folder, outFile) {
  const dirs = fs.readdirSync(folder);
  const data = {};

  dirs.forEach(d => {
    const p = path.join(folder, d, 'index.html');
    if (fs.existsSync(p)) {
      const html = fs.readFileSync(p, 'utf8');
      const m = html.match(/<div class="x-text x-content[^"]*">\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/);
      if (m) {
        const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text.includes(' is ') || text.includes(' was ') || text.includes(' the ') || text.includes(' and ') || text.includes(' of ')) {
          data[d] = {
            relPath: path.join(folder, d, 'index.html').replace(/\\/g, '/'),
            originalHtmlBlock: m[0],
            text: text
          };
        }
      }
    }
  });

  fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${Object.keys(data).length} entries to ${outFile}`);
}

dumpBios('marvel/characters', 'scratch/marvel_chars_en.json');
dumpBios('marvel/events', 'scratch/marvel_events_en.json');
