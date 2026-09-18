const cp = require('child_process');
const out = cp.execSync('git show 3285f4e3:dc/characters/aquaman-reading-order/index.html', { maxBuffer: 10 * 1024 * 1024 }).toString();
const start = out.indexOf('<style id="cs-page-css">');
if (start !== -1) {
  const end = out.indexOf('</style>', start);
  const css = out.substring(start + '<style id="cs-page-css">'.length, end);
  console.log('Original cs-page-css:');
  console.log(css);
} else {
  console.log('Not found');
}
