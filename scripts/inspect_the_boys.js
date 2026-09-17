const fs = require('fs');
const html = fs.readFileSync('site/other/the-boys-reading-order/index.html', 'utf8');
console.log('Has x-widgetbar in HTML:', html.includes('x-widgetbar'));
console.log('Has x-topbar in HTML:', html.includes('x-topbar'));
console.log('Has x-skip-links in HTML:', html.includes('x-skip-links'));

const mastheadIdx = html.indexOf('<header');
const navbarIdx = html.indexOf('x-navbar-wrap');
console.log('\n--- Between Header and Navbar ---');
console.log(html.substring(mastheadIdx, navbarIdx));
