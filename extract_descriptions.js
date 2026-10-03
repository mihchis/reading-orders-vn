const fs = require('fs');

const filenames = [
  "Brightest Day Reading Order.html",
  "Dark Nights_ Death Metal Reading Order.html",
  "Dark Nights_ Metal Reading Order.html",
  "Flashpoint Reading Order.html",
  "Green Lantern_ Godhead Reading Order.html",
  "Green Lantern_ Lights Out Reading Order.html",
  "Green Lantern_ Uprising Reading Order.html",
  "Red Daughter of Krypton Reading Order.html",
  "Rise of the Third Army Reading Order.html",
  "War of the Green Lanterns Reading Order.html",
  "Wrath of the First Lantern Reading Order.html"
];

const results = [];

filenames.forEach(fn => {
  const html = fs.readFileSync('updatte/' + fn, 'utf8');

  // Title
  let title = '';
  const hM = html.match(/<h[12][^>]*>(?:<span>)?<strong>([^<]+)<\/strong>(?:<\/span>)?<\/h[12]>/i) ||
             html.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
  if (hM) title = hM[1].replace(/<[^>]+>/g, '').trim();

  // Canonical slug
  const canonM = html.match(/<link[^>]+rel=["']canonical["'][^>]+(?:href|data-savepage-href)=["']([^"']+)["']/i);
  let slug = '';
  if (canonM) {
    const parts = canonM[1].replace(/\/+$/, '').split('/');
    slug = parts[parts.length - 1];
  }

  // Description / Overview
  let desc = '';
  const descM = html.match(/<div[^>]*class="x-text mlm"[^>]*>([\s\S]*?)<\/div>/i) ||
                html.match(/<div[^>]*class="x-column x-sm x-1-2"[^>]*>[\s\S]*?<div[^>]*class="x-text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (descM) {
    desc = descM[1].replace(/<[^>]+>/g, '').trim();
  }

  // Meta info
  const yearM = html.match(/<strong>Year Published:?<\/strong>:?\s*([^\n<]+)/i);
  const charM = html.match(/<strong>Featured Characters:?<\/strong>:?\s*([^\n<]+)/i);
  const prevM = html.match(/<strong>Previous Event:?<\/strong>:?\s*([\s\S]*?)<br/i);
  const nextM = html.match(/<strong>Next Event:?<\/strong>:?\s*([\s\S]*?)(?:<\/p>|<strong>|<br)/i);

  // Counter
  let count = '';
  const counterM = html.match(/data-x-element-counter="\{&quot;to&quot;:&quot;(\d+)&quot;/i) ||
                   html.match(/class="x-counter-number">(\d+)<\/span>/i) ||
                   html.match(/class="number">(\d+)<\/span>/i);
  if (counterM) count = counterM[1];

  results.push({
    file: fn,
    title,
    slug,
    count,
    year: yearM ? yearM[1].trim() : '',
    chars: charM ? charM[1].trim() : '',
    prevRaw: prevM ? prevM[1].trim() : '',
    nextRaw: nextM ? nextM[1].trim() : '',
    desc
  });
});

fs.writeFileSync('descriptions.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Extracted all 11 descriptions to descriptions.json');
