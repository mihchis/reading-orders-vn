const fs = require('fs');
const content = fs.readFileSync('tham_khao/Marvel Events.html', 'utf8');
const bodyIndex = content.indexOf('<body');
const s = content.substring(bodyIndex);

const matches = [];
const regex = /<h4[^>]*>[\s\S]*?<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h4>(?:[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>)?/gi;
let m;
while ((m = regex.exec(s)) !== null) {
  const url = m[1].trim();
  const rawTitle = m[2].replace(/<[^>]+>/g, '').trim();
  const rawSub = m[3] ? m[3].replace(/<[^>]+>/g, '').trim() : '';

  if (rawTitle && rawTitle.length > 1 && !rawTitle.includes('Comic Book Reading Orders') && !url.includes('contact') && !url.includes('faq')) {
    matches.push({
      url,
      title: rawTitle,
      subtitle: rawSub
    });
  }
}

console.log('Tổng số sự kiện tìm thấy trong Marvel Events.html:', matches.length);
console.log('15 sự kiện đầu:', JSON.stringify(matches.slice(0, 15), null, 2));
