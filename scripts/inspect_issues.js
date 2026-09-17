const fs = require('fs');
const path = require('path');

const sampleFile = path.resolve(__dirname, '..', 'site/marvel/events/house-of-m-reading-order/index.html');
const content = fs.readFileSync(sampleFile, 'utf8');

const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
let count = 0;
let match;
const samples = [];
while ((match = regex.exec(content)) !== null) {
  count++;
  if (samples.length < 5 && match[1].includes('House of M') || match[1].includes('Spider-Man')) {
    samples.push(match[1].trim());
  }
}

console.log('Total li tags:', count);
console.log('Sample issue lis:', samples);
