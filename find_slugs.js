const fs = require('fs');
const html = fs.readFileSync('dc/events/index.html', 'utf8');

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
  const content = fs.readFileSync('updatte/' + fn, 'utf8');
  const canonMatch = content.match(/<link[^>]+rel=["']canonical["'][^>]+(?:href|data-savepage-href)=["']([^"']+)["']/i);
  let slug = '';
  if (canonMatch) {
    const u = canonMatch[1];
    const parts = u.replace(/\/+$/, '').split('/');
    slug = parts[parts.length - 1];
  }
  const inIndex = html.includes(slug);
  console.log(slug, '=> In dc/events/index.html:', inIndex);
});
