const fs = require('fs');
const html = fs.readFileSync('site/marvel/events/house-of-m-reading-order/index.html', 'utf8');

// Check what document.querySelector('.x-tabs-panel') returns in House of M
const panelIdx = html.indexOf('class=\"x-tabs-panel');
console.log('Panel index:', panelIdx);
console.log(html.substring(panelIdx - 50, panelIdx + 300));
