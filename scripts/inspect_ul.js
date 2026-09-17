const fs = require('fs');
const path = require('path');

const sampleFile = path.resolve(__dirname, '..', 'site/marvel/events/house-of-m-reading-order/index.html');
const content = fs.readFileSync(sampleFile, 'utf8');

// Find ul tags
const ulMatches = content.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi) || [];
console.log('Found UL blocks:', ulMatches.length);
for (let i = 0; i < Math.min(ulMatches.length, 3); i++) {
  const ul = ulMatches[i];
  const lis = (ul.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || []).slice(0, 3);
  console.log(`\n--- UL #${i} (${lis.length} sample items) ---`);
  lis.forEach(li => console.log(li.replace(/\s+/g, ' ')));
}
