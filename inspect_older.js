const fs = require('fs');

const filenames = [
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
  console.log('=== ' + fn + ' ===');
  
  // Find entry-content or cs-content or first 2000 chars after <article
  const artIdx = html.indexOf('<article');
  if (artIdx !== -1) {
    const snippet = html.substring(artIdx, artIdx + 2000);
    // Print lines with h1, p, counter
    const lines = snippet.split('\n');
    lines.forEach(l => {
      if (/<h1|<h2|<h3|<h4|<strong>Year|<strong>Previous|<strong>Next|<strong>Featured|class="x-counter/i.test(l)) {
        console.log('  ', l.trim());
      }
    });
  }
});
