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

filenames.forEach(fn => {
  const html = fs.readFileSync('updatte/' + fn, 'utf8');
  
  // Title
  let title = '';
  const h1M = html.match(/<h1[^>]*><span><strong>([^<]+)<\/strong><\/span><\/h1>/i) || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1M) title = h1M[1].replace(/<[^>]+>/g, '').trim();

  // Canonical slug
  const canonM = html.match(/<link[^>]+rel=["']canonical["'][^>]+(?:href|data-savepage-href)=["']([^"']+)["']/i);
  let slug = '';
  if (canonM) {
    const parts = canonM[1].replace(/\/+$/, '').split('/');
    slug = parts[parts.length - 1];
  }

  // Counter
  let count = '';
  const counterM = html.match(/data-x-element-counter="\{&quot;to&quot;:&quot;(\d+)&quot;/i) ||
                   html.match(/class="x-counter-number">(\d+)<\/span>/i) ||
                   html.match(/class="number">(\d+)<\/span>/i);
  if (counterM) count = counterM[1];

  // Year & Characters & Prev & Next
  const yearM = html.match(/<strong>Year Published<\/strong>:\s*([^\n<]+)/i);
  const charM = html.match(/<strong>Featured Characters<\/strong>:\s*([^\n<]+)/i);
  const prevM = html.match(/<strong>Previous Event<\/strong>:\s*([\s\S]*?)<br>/i);
  const nextM = html.match(/<strong>Next Event<\/strong>:\s*([\s\S]*?)<\/p>/i);

  // Tabs?
  const hasTabs = html.includes('data-x-element-tabs') || html.includes('x-tabs');

  console.log('--------------------------------------------------');
  console.log('File:', fn);
  console.log('Title:', title, '| Slug:', slug, '| Count:', count, '| Tabs:', hasTabs);
  console.log('Year:', yearM ? yearM[1].trim() : 'N/A');
  console.log('Chars:', charM ? charM[1].trim() : 'N/A');
  console.log('Prev:', prevM ? prevM[1].replace(/<[^>]+>/g, '').trim() : 'None');
  console.log('Next:', nextM ? nextM[1].replace(/<[^>]+>/g, '').trim() : 'None');
});
