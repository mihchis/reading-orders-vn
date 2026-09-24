const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Update marvel/event-timeline/index.html
const marvelTimelinePath = path.join(rootDir, 'marvel', 'event-timeline', 'index.html');
if (fs.existsSync(marvelTimelinePath)) {
  let content = fs.readFileSync(marvelTimelinePath, 'utf8');

  content = content.replace(
    '<title>Marvel Event Timeline</title>',
    '<title>Dòng Thời Gian Sự Kiện Marvel</title>'
  );

  content = content.replace(
    /<meta name="description" content="Welcome to the Marvel Event Timeline\.[^"]*"\s*\/>/g,
    '<meta name="description" content="Chào mừng bạn đến với Dòng Thời Gian Sự Kiện Marvel. Danh sách tổng hợp toàn bộ các sự kiện và crossover của Marvel theo trình tự thời gian." />'
  );

  content = content.replace(
    /<meta property="og:title" content="Marvel Event Timeline"\s*\/>/g,
    '<meta property="og:title" content="Dòng Thời Gian Sự Kiện Marvel" />'
  );

  content = content.replace(
    /<meta property="og:description" content="Welcome to the Marvel Event Timeline\.[^"]*"\s*\/>/g,
    '<meta property="og:description" content="Chào mừng bạn đến với Dòng Thời Gian Sự Kiện Marvel. Danh sách tổng hợp toàn bộ các sự kiện và crossover của Marvel theo trình tự thời gian." />'
  );

  content = content.replace(
    /<span itemprop="name">Marvel Event Timeline<\/span>/g,
    '<span itemprop="name">Dòng Thời Gian Sự Kiện Marvel</span>'
  );

  content = content.replace(
    /<p style="text-align: justify;">Welcome to the Marvel Event Timeline[\s\S]*?<\/p>/,
    '<p style="text-align: justify;">Chào mừng bạn đến với Dòng Thời Gian Sự Kiện Marvel (Marvel Event Timeline). Đây là danh sách tổng hợp toàn bộ các sự kiện và crossover của Marvel theo trình tự thời gian. Danh mục này cũng bao gồm các sự kiện lớn trong lịch sử Marvel diễn ra trong khuôn khổ một đầu truyện đơn lẻ như Kree-Skrull War hay Infinity Abyss. Các sự kiện được sắp xếp theo đúng trình tự xuất hiện trong <a href="../marvel-master-reading-order/index.html">Marvel Master Reading Order</a>.</p>'
  );

  content = content.replace(
    /<span><strong>Event Order<\/strong><\/span>/g,
    '<span><strong>Thứ Tự Các Sự Kiện</strong></span>'
  );

  // Era / universe notes
  content = content.replace(/An Alternate Universe\./g, 'Một vũ trụ song song (Alternate Universe).');
  content = content.replace(/&#8211; Included in the Age of Apocalypse Reading Order\./g, '&#8211; Bao gồm trong thứ tự đọc Age of Apocalypse.');
  content = content.replace(/Occurs during the same time as Civil War\./g, 'Diễn ra cùng khoảng thời gian với Civil War.');
  content = content.replace(/&#8211; Included in the World War Hulk Reading Order\./g, '&#8211; Bao gồm trong thứ tự đọc World War Hulk.');
  content = content.replace(/Included in the X-Men: Manifest Destiny Reading Order\./g, 'Bao gồm trong thứ tự đọc X-Men: Manifest Destiny.');
  content = content.replace(/&#8211; Takes place during Dark Reign\./g, '&#8211; Diễn ra trong thời gian Dark Reign.');
  content = content.replace(/<b>Marvel NOW! starts here\.<\/b>/g, '<b>Kỷ nguyên Marvel NOW! bắt đầu từ đây.</b>');
  content = content.replace(/Occurs near the beginning of Avengers &amp; X-Men: AXIS/g, 'Diễn ra vào khoảng đầu của Avengers &amp; X-Men: AXIS');
  content = content.replace(/<strong>All-New, All-Different Marvel starts here\.<\/strong>/g, '<strong>Kỷ nguyên All-New, All-Different Marvel bắt đầu từ đây.</strong>');
  content = content.replace(/<strong>Marvel Legacy starts here\.<\/strong>/g, '<strong>Kỷ nguyên Marvel Legacy bắt đầu từ đây.</strong>');
  content = content.replace(/<strong>A Fresh Start starts here\.<\/strong>/g, '<strong>Kỷ nguyên A Fresh Start bắt đầu từ đây.</strong>');

  fs.writeFileSync(marvelTimelinePath, content, 'utf8');
  console.log('Updated marvel/event-timeline/index.html successfully');
}

// 2. Update dc/event-timeline/index.html
const dcTimelinePath = path.join(rootDir, 'dc', 'event-timeline', 'index.html');
if (fs.existsSync(dcTimelinePath)) {
  let content = fs.readFileSync(dcTimelinePath, 'utf8');

  content = content.replace(
    '<title>DC Event Timeline</title>',
    '<title>Dòng Thời Gian Sự Kiện DC</title>'
  );

  content = content.replace(
    /<meta name="description" content="Welcome to the DC Event Timeline\.[^"]*"\s*\/>/g,
    '<meta name="description" content="Chào mừng bạn đến với Dòng Thời Gian Sự Kiện DC. Danh sách tổng hợp toàn bộ các sự kiện và crossover của DC theo trình tự thời gian." />'
  );

  content = content.replace(
    /<meta property="og:title" content="DC Event Timeline"\s*\/>/g,
    '<meta property="og:title" content="Dòng Thời Gian Sự Kiện DC" />'
  );

  content = content.replace(
    /<meta property="og:description" content="Welcome to the DC Event Timeline\.[^"]*"\s*\/>/g,
    '<meta property="og:description" content="Chào mừng bạn đến với Dòng Thời Gian Sự Kiện DC. Danh sách tổng hợp toàn bộ các sự kiện và crossover của DC theo trình tự thời gian." />'
  );

  content = content.replace(
    /<span itemprop="name">DC Event Timeline<\/span>/g,
    '<span itemprop="name">Dòng Thời Gian Sự Kiện DC</span>'
  );

  content = content.replace(
    /<p style="text-align: justify;">Welcome to the DC Event Timeline[\s\S]*?<\/p>/,
    '<p style="text-align: justify;">Chào mừng bạn đến với Dòng Thời Gian Sự Kiện DC (DC Event Timeline). Đây là danh sách tổng hợp toàn bộ các sự kiện và crossover của DC theo trình tự thời gian. Danh mục này cũng bao gồm các sự kiện lớn trong lịch sử DC diễn ra trong khuôn khổ một đầu truyện đơn lẻ như 52 hay Cosmic Odyssey. Các sự kiện được sắp xếp theo đúng trình tự xuất hiện trong <a class="dc-class" href="../dc-master-reading-order/index.html">DC Master Reading Order</a>.</p>'
  );

  content = content.replace(
    /<span><strong>Event Order<\/strong><\/span>/g,
    '<span><strong>Thứ Tự Các Sự Kiện</strong></span>'
  );

  // Era / note translations
  content = content.replace(/Takes place during Reign of the Supermen/g, 'Diễn ra trong thời gian Reign of the Supermen');
  content = content.replace(/Takes place simultaneously with Underworld Unleashed/g, 'Diễn ra đồng thời với Underworld Unleashed');
  content = content.replace(/Takes place simultaneously with The Trial of Superman/g, 'Diễn ra đồng thời với The Trial of Superman');
  content = content.replace(/Takes place during Countdown to Infinite Crisis/g, 'Diễn ra trong thời gian Countdown to Infinite Crisis');
  content = content.replace(/Countdown to Final Crisis \(2007\) &#8211; <span style="color: #0000ff;">A terrible event which is completely ignored by Final Crisis\.<\/span>/g, 'Countdown to Final Crisis (2007) &#8211; <span style="color: #0000ff;">Một sự kiện gây thất vọng và hoàn toàn bị bỏ qua bởi Final Crisis.</span>');
  content = content.replace(/<strong><span style="color: #0000ff;">The New 52 starts here\.<\/span><\/strong>/g, '<strong><span style="color: #0000ff;">Kỷ nguyên The New 52 bắt đầu từ đây.</span></strong>');
  content = content.replace(/Takes place during Forever Evil/g, 'Diễn ra trong thời gian Forever Evil');
  content = content.replace(/<span style="color: #0000ff;"><strong>DC You starts here\.<\/strong><\/span>/g, '<span style="color: #0000ff;"><strong>Kỷ nguyên DC You bắt đầu từ đây.</strong></span>');
  content = content.replace(/<strong><span style="color: #0000ff;">DC Rebirth starts here\.<\/span><\/strong>/g, '<strong><span style="color: #0000ff;">Kỷ nguyên DC Rebirth bắt đầu từ đây.</span></strong>');
  content = content.replace(/<span style="color: #0000ff;"><strong>Infinite Frontier starts here\.<\/strong><\/span>/g, '<span style="color: #0000ff;"><strong>Kỷ nguyên Infinite Frontier bắt đầu từ đây.</strong></span>');
  content = content.replace(/<span style="color: #0000ff;"><strong>Dawn of DC starts here\.<\/strong><\/span>/g, '<span style="color: #0000ff;"><strong>Kỷ nguyên Dawn of DC bắt đầu từ đây.</strong></span>');
  content = content.replace(/<strong><span style="color: #0000ff;">DC All In starts here\.<\/span><\/strong>/g, '<strong><span style="color: #0000ff;">Kỷ nguyên DC All In bắt đầu từ đây.</span></strong>');
  content = content.replace(/\(2025\) &#8211; Available on <a href="mailto:trin79136@gmail\.com">Patreon<\/a>/g, '(2025) &#8211; <span style="color: #0000ff;">Đang cập nhật</span>');

  fs.writeFileSync(dcTimelinePath, content, 'utf8');
  console.log('Updated dc/event-timeline/index.html successfully');
}
