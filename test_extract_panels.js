const fs = require('fs');

const filenames = [
  "Brightest Day Reading Order.html",
  "Dark Nights_ Death Metal Reading Order.html",
  "Dark Nights_ Metal Reading Order.html",
  "Flashpoint Reading Order.html",
  "Green Lantern_ Godhead Reading Order.html",
  "Green Lantern_ Lights Out Reading Order.html",
  "Green Lantern_ Uprising Reading Order.html",
  "Red Daughter of Krypton Reading Order.html",
  "Rise of the Third Army Reading Order.html",
  "War of the Green Lanterns Reading Order.html",
  "Wrath of the First Lantern Reading Order.html"
];

filenames.forEach(fn => {
  const html = fs.readFileSync('updatte/' + fn, 'utf8');

  // Look for tabs panels or single list
  const p1Match = html.match(/id=["'](?:panel-[^"']+|panel-single)["'][^>]*>([\s\S]*?)<\/div>(?:<div id=["'](?:panel-[^"']+|panel-tpb)["']|<\/div><\/div><\/div><\/div>)/i);
  const p2Match = html.match(/id=["'](?:panel-[^"']*30|panel-tpb)["'][^>]*>([\s\S]*?)<\/div><\/div><\/div><\/div><\/div><\/div><\/div>/i) ||
                  html.match(/id=["']panel-e[^"']*-e30["'][^>]*>([\s\S]*?)<\/div><\/div><\/div>/i);
  
  // Or find all panels with role="tabpanel"
  const panels = [];
  const panelRe = /<div[^>]+role=["']tabpanel["'][^>]*>([\s\S]*?)<\/div>(?=(?:<div[^>]+role=["']tabpanel["']|<\/div><\/div><\/div>|<footer))/gi;
  let pm;
  while ((pm = panelRe.exec(html)) !== null) {
    panels.push(pm[1].length);
  }

  // Count <p> in article
  const artM = html.match(/<article[\s\S]*?<\/article>/i);
  let pCount = 0;
  if (artM) {
    const ps = artM[0].match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    pCount = ps.length;
  }

  console.log(fn, '| Tabpanels found:', panels.length, '| Lengths:', panels, '| Total Ps:', pCount);
});
