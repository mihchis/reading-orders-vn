const fs = require('fs');

function inspectPage(p) {
  if (!fs.existsSync(p)) return console.log('Not found:', p);
  const html = fs.readFileSync(p, 'utf8');
  console.log('=== ' + p + ' ===');
  const matches = html.match(/<div class="x-text x-content[^"]*">([\s\S]*?)<\/div>/g);
  if (matches) {
    matches.slice(0, 3).forEach((b, i) => {
      console.log(`Text block ${i + 1}:`, b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200));
    });
  }
}

inspectPage('marvel/events/civil-war-reading-order/index.html');
inspectPage('dc/events/crisis-on-infinite-earths-reading-order/index.html');
inspectPage('marvel/characters/spider-man-reading-order/index.html');
inspectPage('dc/characters/batman-reading-order/index.html');
inspectPage('other/invincible-reading-order/index.html');
