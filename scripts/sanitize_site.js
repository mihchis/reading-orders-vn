const fs = require('fs');
const path = require('path');

const siteDir = path.resolve(__dirname, '..', 'site');

let cleanedCount = 0;

function cleanHtmlContent(content) {
  let modified = content;
  // 1. Remove HTTrack comments and meta tags
  modified = modified.replace(/<!-- Mirrored from [^>]+ -->\r?\n?/g, '');
  modified = modified.replace(/<!-- Added by HTTrack -->[\s\S]*?<!-- \/Added by HTTrack -->\r?\n?/g, '');
  modified = modified.replace(/<!-- Created by HTTrack [^>]+ -->\r?\n?/g, '');
  
  // 2. Remove Google Analytics scripts
  modified = modified.replace(/<!-- Google tag[\s\S]*?<\/script>\r?\n?/g, '');
  modified = modified.replace(/<script id=["']google_gtagjs-js["'][\s\S]*?<\/script>\r?\n?/g, '');
  modified = modified.replace(/<script id=["']google_gtagjs-js-after["'][\s\S]*?<\/script>\r?\n?/g, '');
  
  // 3. Replace absolute site URLs to root relative
  modified = modified.replace(/https:\/\/comicbookreadingorders\.com\//g, '/');

  return modified;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'wp-json') {
        walkDir(full);
      }
    } else if (entry.name.endsWith('.html')) {
      const original = fs.readFileSync(full, 'utf8');
      const cleaned = cleanHtmlContent(original);
      if (cleaned !== original) {
        fs.writeFileSync(full, cleaned, 'utf8');
        cleanedCount++;
      }
    }
  }
}

console.log('Bắt đầu dọn dẹp mã nguồn HTML...');
const start = Date.now();
walkDir(siteDir);
console.log(`Đã dọn dẹp xong ${cleanedCount} file HTML trong ${((Date.now() - start) / 1000).toFixed(2)}s`);
