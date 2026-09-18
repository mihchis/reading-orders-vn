const fs = require('fs');
const path = require('path');
const https = require('https');

function translateText(text) {
  return new Promise((resolve, reject) => {
    const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=' + encodeURIComponent(text);
    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          const translated = json[0].map(s => s[0]).join('');
          resolve(translated);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function refineComicText(text) {
  return text
    .replace(/\bnhân vật phản diện\b/gi, 'kẻ phản diện')
    .replace(/\bđột biến\b/gi, 'dị nhân')
    .replace(/\bĐột biến\b/gi, 'Dị nhân')
    .replace(/\bNgười nhện\b/gi, 'Spider-Man')
    .replace(/\bNgười sắt\b/gi, 'Iron Man')
    .replace(/\bNgười dơi\b/gi, 'Batman')
    .replace(/\bsiêu anh hùng\b/gi, 'siêu anh hùng')
    .replace(/\s+/g, ' ')
    .trim();
}

async function testSample() {
  const chars = JSON.parse(fs.readFileSync('scratch/marvel_chars_en.json', 'utf8'));
  const keys = Object.keys(chars).slice(0, 5);
  for (const k of keys) {
    const item = chars[k];
    console.log(`Translating ${k}...`);
    const vi = await translateText(item.text);
    const refined = refineComicText(vi);
    console.log('Original:', item.text.slice(0, 80));
    console.log('Vietnamese:', refined);
    console.log('---');
    await new Promise(r => setTimeout(r, 200));
  }
}

testSample().catch(console.error);
