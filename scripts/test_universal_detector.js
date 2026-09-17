const fs = require('fs');

function testDetect(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');

  // Cách 1: Tìm container có nhiều <br> (Format A: The Boys, House of M)
  const nodeMatches = html.match(/<(?:p|div)[^>]*class=["'][^"']*x-text[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div)>/gi) || [];
  const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const allNodes = [...nodeMatches, ...pMatches];

  let brIssues = 0;
  for (const n of allNodes) {
    if (n.includes('<br') && (n.includes('#') || n.includes('Vol.') || n.includes('color:'))) {
      const lines = n.split(/<br\s*\/?>/i);
      const count = lines.filter(l => /#\d+|Vol\.|Part\s+\d+|Annual|Special|One-Shot/i.test(l) || /<span[^>]+style=[^>]+color/i.test(l)).length;
      if (count > brIssues) brIssues = count;
    }
  }

  // Cách 2: Tìm các thẻ <p> đứng riêng lẻ (Format B: Flashpoint)
  let pIssues = 0;
  for (const p of pMatches) {
    if (/#\d+|Vol\.|Part\s+\d+|Annual|Special|One-Shot/i.test(p) || /<span[^>]+style=[^>]+color/i.test(p)) {
      pIssues++;
    }
  }

  return { brIssues, pIssues, totalDetected: Math.max(brIssues, pIssues) };
}

const files = [
  'site/marvel/events/house-of-m-reading-order/index.html',
  'site/dc/events/flashpoint-reading-order/index.html',
  'site/other/the-boys-reading-order/index.html',
  'site/marvel/characters/spider-man-reading-order/index.html',
  'site/dc/characters/batman-reading-order/index.html'
];

for (const f of files) {
  const res = testDetect(f);
  console.log(f.padEnd(55), 'BR:', res.brIssues, 'P:', res.pIssues, 'Detected:', res.totalDetected);
}
