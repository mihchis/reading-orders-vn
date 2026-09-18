const fs = require('fs');
const fIndex = fs.readFileSync('site/index.html', 'utf8');
const fCivilWar = fs.readFileSync('site/marvel/events/civil-war-reading-order/index.html', 'utf8');
function clean(css) {
  return css.replace(/(\.\.\/)+wp-content/g, '/wp-content')
            .replace(/(transparent\s*){2,}/g, 'transparent ');
}
const csIndex = clean(fIndex.match(/<style[^>]*id="cs-inline-css"[^>]*>([\s\S]*?)<\/style>/i)[1]);
const csCivilWar = clean(fCivilWar.match(/<style[^>]*id="cs-inline-css"[^>]*>([\s\S]*?)<\/style>/i)[1]);
let cp = 0;
while (cp < csIndex.length && cp < csCivilWar.length && csIndex[cp] === csCivilWar[cp]) cp++;
console.log('common prefix:', cp, 'total1:', csIndex.length, 'total2:', csCivilWar.length);
console.log('first diff 50 chars:', JSON.stringify(csIndex.substring(cp, cp + 50)));
console.log('second diff 50 chars:', JSON.stringify(csCivilWar.substring(cp, cp + 50)));
