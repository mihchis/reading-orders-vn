const fs = require('fs');

const fns = [
  "Brightest Day Reading Order.html",
  "Dark Nights_ Death Metal Reading Order.html",
  "Dark Nights_ Metal Reading Order.html"
];

fns.forEach(fn => {
  const html = fs.readFileSync('updatte/' + fn, 'utf8');
  console.log('=== ' + fn + ' ===');
  const m = html.match(/<article[\s\S]*?<\/article>/i);
  if (m) {
    const art = m[0];
    const pMatches = art.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    pMatches.slice(0, 5).forEach((p, idx) => {
      console.log(`P[${idx}]:`, p.replace(/<[^>]+>/g, '').trim());
    });
  }
});
