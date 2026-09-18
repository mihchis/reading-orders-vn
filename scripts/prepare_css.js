const fs = require('fs');
const path = require('path');

['scripts', 'server'].forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir, { recursive: true }).forEach(f => {
      if (f.endsWith('.js') || f.endsWith('.ts')) {
        const p = path.join(dir, f);
        const c = fs.readFileSync(p, 'utf8');
        if (c.includes("'site'") || c.includes('"site"') || c.includes('site/')) {
          console.log('Found reference in', p);
        }
      }
    });
  }
});
