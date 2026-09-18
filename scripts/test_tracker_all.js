const fs = require('fs');
const path = require('path');

// Giả lập DOM đơn giản bằng regex giống addon.js để kiểm tra
function simulateAddon(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  
  // Tìm candidateNodes
  // Trong addon.js:
  // singleIssuePanel.querySelectorAll('p, .x-text')
  // node.innerHTML có <br và (# hoặc Vol. hoặc color:)
  
  // Tìm tất cả block p hoặc x-text
  const nodeMatches = html.match(/<(?:p|div)[^>]*class=["'][^"']*x-text[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|div)>/gi) || [];
  const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const allNodes = [...nodeMatches, ...pMatches];

  let maxIssues = 0;
  let bestSample = '';

  for (const n of allNodes) {
    if (n.includes('<br') && (n.includes('#') || n.includes('Vol.') || n.includes('color:'))) {
      const lines = n.split(/<br\s*\/?>/i);
      let issueCount = 0;
      for (const l of lines) {
        const trimmed = l.trim();
        if (/#\d+|Vol\.|Part\s+\d+|Annual|Special|One-Shot/i.test(trimmed) || /<span[^>]+style=[^>]+color/i.test(trimmed)) {
          issueCount++;
        }
      }
      if (issueCount > maxIssues) {
        maxIssues = issueCount;
        bestSample = lines[0].replace(/<[^>]+>/g, '').trim();
      }
    }
  }

  return { maxIssues, bestSample };
}

const testFiles = [
  'marvel/events/house-of-m-reading-order/index.html',
  'dc/events/flashpoint-reading-order/index.html',
  'other/the-boys-reading-order/index.html',
  'marvel/characters/spider-man-reading-order/index.html',
  'dc/characters/batman-reading-order/index.html',
  'marvel/marvel-master-reading-order-part-1/index.html'
];

for (const f of testFiles) {
  if (fs.existsSync(f)) {
    const res = simulateAddon(f);
    console.log(f.padEnd(60), 'Found issues:', res.maxIssues, 'Sample:', res.bestSample.substring(0, 30));
  } else {
    console.log(f, 'NOT FOUND');
  }
}
