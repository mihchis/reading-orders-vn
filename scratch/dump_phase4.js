const fs = require('fs');
const path = require('path');

function dumpRemaining(outFile) {
  const data = {};
  const rootDir = path.resolve(__dirname, '..');

  function checkDir(folder) {
    if (!fs.existsSync(folder)) return;
    const entries = fs.readdirSync(folder, { withFileTypes: true });
    entries.forEach(e => {
      if (e.isDirectory()) {
        const sub = path.join(folder, e.name);
        const p = path.join(sub, 'index.html');
        if (fs.existsSync(p)) {
          const html = fs.readFileSync(p, 'utf8');
          const m = html.match(/<div[^>]*class="[^"]*x-text[^"]*"[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/);
          if (m) {
            const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (text.includes(' is ') || text.includes(' was ') || text.includes(' the ') || text.includes(' and ') || text.includes(' of ') || text.includes(' in ')) {
              const rel = path.relative(rootDir, p).replace(/\\/g, '/');
              data[e.name] = {
                relPath: rel,
                text: text
              };
            }
          }
        }
      }
    });
  }

  checkDir('other');
  
  // Also check root marvel and dc era / master orders
  ['marvel', 'dc'].forEach(parent => {
    const entries = fs.readdirSync(parent, { withFileTypes: true });
    entries.forEach(e => {
      if (e.isDirectory() && e.name !== 'characters' && e.name !== 'events' && e.name !== 'event-timeline') {
        const p = path.join(parent, e.name, 'index.html');
        if (fs.existsSync(p)) {
          const html = fs.readFileSync(p, 'utf8');
          const m = html.match(/<div[^>]*class="[^"]*x-text[^"]*"[^>]*>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/);
          if (m) {
            const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (text.includes(' is ') || text.includes(' was ') || text.includes(' the ') || text.includes(' and ') || text.includes(' of ') || text.includes(' in ')) {
              const rel = path.relative(rootDir, p).replace(/\\/g, '/');
              data[e.name] = {
                relPath: rel,
                text: text
              };
            }
          }
        }
      }
    });
  });

  fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${Object.keys(data).length} entries to ${outFile}`);
}

dumpRemaining('scratch/phase4_en.json');
