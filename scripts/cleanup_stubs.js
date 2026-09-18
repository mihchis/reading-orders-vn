const fs = require('fs');
const path = require('path');

const siteDir = path.resolve('site');

function walk(dir) {
  let list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('moz-extension_')) {
        console.log('Deleting moz-extension directory:', full);
        fs.rmSync(full, { recursive: true, force: true });
      } else {
        list = list.concat(walk(full));
      }
    } else {
      list.push(full);
    }
  }
  return list;
}

const allFiles = walk(siteDir);
console.log('Total files in site:', allFiles.length);

let deletedStubs = 0;
allFiles.forEach(f => {
  const base = path.basename(f);
  // Match indexXXXX.html or indexXXXX-Y.html where X is hex/number
  if (/^index[0-9a-fA-F]{4}(-\d+)?\.html$/i.test(base)) {
    const content = fs.readFileSync(f, 'utf8');
    if (content.includes('Page has moved') || content.includes('CONTENT="0; URL=')) {
      fs.unlinkSync(f);
      deletedStubs++;
    } else {
      console.warn('Suspicious file not deleted:', f);
    }
  }
});

console.log(`Deleted ${deletedStubs} redirect stubs.`);

// Now remove shortlink meta tags from remaining HTML files
const remainingFiles = walk(siteDir).filter(f => f.endsWith('.html'));
console.log('Remaining HTML files:', remainingFiles.length);

let shortlinksRemoved = 0;
remainingFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (/<link[^>]*rel=['"]shortlink['"][^>]*>\s*/i.test(content)) {
    content = content.replace(/<link[^>]*rel=['"]shortlink['"][^>]*>\s*/gi, '');
    fs.writeFileSync(f, content, 'utf8');
    shortlinksRemoved++;
  }
});
console.log(`Removed shortlink tags from ${shortlinksRemoved} files.`);
