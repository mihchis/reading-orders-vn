const fs = require('fs');
const html = fs.readFileSync('dc/events/convergence-reading-order/index.html', 'utf8');
const mainStart = html.indexOf('id="x-main"');
console.log(html.substring(mainStart, mainStart + 1500));
