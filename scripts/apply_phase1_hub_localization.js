const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. marvel/events/index.html
{
  const p = path.join(rootDir, 'marvel/events/index.html');
  let html = fs.readFileSync(p, 'utf8');

  html = html.replace('<span><strong>Marvel Events</strong></span>', '<span><strong>Sự Kiện Marvel</strong></span>');
  html = html.replace('<title>Marvel Events - Comic Book Reading Orders</title>', '<title>Sự Kiện Marvel - Thứ Tự Đọc Comic Book Reading Orders VN</title>');

  // Thay thế đoạn văn chào mừng
  html = html.replace(
    /(<div id="x-section-2"[^>]*>[\s\S]*?<div id="" class="x-text mll mrl" >)([\s\S]*?)(<\/div><\/div><\/div><\/div>)/i,
    `$1<p style="text-align: justify;">Chào mừng bạn đến với danh mục Thứ tự đọc Sự kiện Marvel (Marvel Events). Danh sách này bao gồm toàn bộ các tập truyện cốt lõi (core issues) và các đầu truyện liên kết (tie-ins) cho từng sự kiện. Đôi khi, các bộ đọc cũng bao gồm các tập mở đầu (prologue) hoặc kết thúc (epilogue) giúp bạn có trải nghiệm đọc mạch lạc và trọn vẹn nhất. Danh sách cũng bao gồm các giai đoạn thay đổi hiện trạng (status quo) sau các sự kiện lớn (ví dụ: Dark Reign tiếp nối Secret Invasion, Shattered Heroes tiếp nối Fear Itself). Ngoài ra, trang này cũng tổng hợp thứ tự đọc cho các vũ trụ song song lớn của Marvel như Ultimate Marvel và Marvel 2099.</p>\n<p style="text-align: justify;">Nếu bạn muốn theo dõi các sự kiện theo trình tự thời gian vũ trụ, hãy truy cập <a href="../event-timeline/index.html">Dòng Thời Gian Sự Kiện Marvel (Marvel Event Timeline)</a>.</p>\n$3`
  );

  // Thay thế alert X-Men
  html = html.replace(
    /<div id="" class="x-alert x-alert-danger x-alert-block mll mrl mbn"><center>[\s\S]*?<\/center><\/div>/i,
    '<div id="" class="x-alert x-alert-danger x-alert-block mll mrl mbn"><center>Nhiều sự kiện liên quan đặc biệt đến nhóm X-Men được sắp xếp dưới chữ cái <strong>X</strong></center></div>'
  );

  fs.writeFileSync(p, html, 'utf8');
  console.log('[OK] marvel/events/index.html');
}

// 2. dc/events/index.html
{
  const p = path.join(rootDir, 'dc/events/index.html');
  let html = fs.readFileSync(p, 'utf8');

  html = html.replace('<span><strong>DC Events</strong></span>', '<span><strong>Sự Kiện DC</strong></span>');
  html = html.replace('<title>DC Events - Comic Book Reading Orders</title>', '<title>Sự Kiện DC - Thứ Tự Đọc Comic Book Reading Orders VN</title>');

  html = html.replace(
    /(<div id="x-section-2"[^>]*>[\s\S]*?<div id="" class="x-text mll mrl" >)([\s\S]*?)(<\/div><\/div><\/div><\/div>)/i,
    `$1<p style="text-align: justify;">Chào mừng bạn đến với danh mục Thứ tự đọc Sự kiện DC Comics (DC Events). Danh sách này bao gồm toàn bộ các tập truyện cốt lõi (core issues) và các đầu truyện liên kết (tie-ins) cho từng sự kiện. Đôi khi, các bộ đọc cũng bao gồm các tập mở đầu (prologue) hoặc kết thúc (epilogue) nhằm mang lại trải nghiệm đọc mạch lạc và hấp dẫn nhất.</p>\n<p style="text-align: justify;">Nếu bạn muốn theo dõi các sự kiện theo trình tự thời gian vũ trụ, hãy truy cập <a class="dc-class" href="../event-timeline/index.html">Dòng Thời Gian Sự Kiện DC (DC Event Timeline)</a>.</p>\n$3`
  );

  html = html.replace(
    /<div id="" class="x-alert x-alert-info x-alert-block mll mrl mbn">[\s\S]*?<\/div>/i,
    '<div id="" class="x-alert x-alert-info x-alert-block mll mrl mbn">Nhiều sự kiện gắn liền với từng nhân vật cụ thể được xếp theo chữ cái đầu tên nhân vật đó. Ví dụ: sự kiện riêng của Batman nằm ở chữ cái <strong>B</strong>, sự kiện của Superman nằm ở chữ cái <strong>S</strong>...</div>'
  );

  html = html.replace('Aquaman: Death of a Prince (1974)', 'Aquaman: Death of a Prince (1974)');

  fs.writeFileSync(p, html, 'utf8');
  console.log('[OK] dc/events/index.html');
}

// 3. marvel/characters/index.html
{
  const p = path.join(rootDir, 'marvel/characters/index.html');
  let html = fs.readFileSync(p, 'utf8');

  html = html.replace('<span><strong>Marvel Characters</strong></span>', '<span><strong>Nhân Vật Marvel</strong></span>');
  html = html.replace('<title>Marvel Characters - Comic Book Reading Orders</title>', '<title>Nhân Vật Marvel - Thứ Tự Đọc Comic Book Reading Orders VN</title>');

  html = html.replace(
    /(<div id="x-section-2"[^>]*>[\s\S]*?<div id="" class="x-text mll mrl" >)([\s\S]*?)(<\/div><\/div><\/div><\/div>)/i,
    `$1<p style="text-align: justify;">Chào mừng bạn đến với danh mục Thứ tự đọc theo Nhân vật Marvel. Các bộ đọc ở đây được tinh tuyển khác biệt so với thứ tự đọc thông thường: thay vì liệt kê máy móc tất cả mọi lần nhân vật xuất hiện trong hàng chục năm, chúng tôi chọn lọc các đầu truyện xuất sắc nhất, các bước ngoặt phát triển nhân vật quan trọng và những câu chuyện hay nhất của từng siêu anh hùng hay phản diện.</p>\n<p style="text-align: justify;">Bộ đếm số tập trong từng thứ tự đọc nhân vật không bao gồm các sự kiện lớn. Tập truyện xuất hiện đầu tiên (First appearance) được tính theo tập sớm nhất nhân vật góp mặt, không nhất thiết phải là câu chuyện nguồn gốc.</p>\n$3`
  );

  fs.writeFileSync(p, html, 'utf8');
  console.log('[OK] marvel/characters/index.html');
}

// 4. dc/characters/index.html
{
  const p = path.join(rootDir, 'dc/characters/index.html');
  let html = fs.readFileSync(p, 'utf8');

  html = html.replace('<span><strong>DC Characters</strong></span>', '<span><strong>Nhân Vật DC</strong></span>');
  html = html.replace('<title>DC Characters - Comic Book Reading Orders</title>', '<title>Nhân Vật DC - Thứ Tự Đọc Comic Book Reading Orders VN</title>');

  html = html.replace(
    /(<div id="x-section-2"[^>]*>[\s\S]*?<div id="" class="x-text mll mrl" >)([\s\S]*?)(<\/div><\/div><\/div><\/div>)/i,
    `$1<p style="text-align: justify;">Chào mừng bạn đến với danh mục Thứ tự đọc theo Nhân vật DC Comics. Các bộ đọc ở đây được tinh tuyển để mang lại trải nghiệm đọc thuận tiện nhất: thay vì liệt kê dàn trải toàn bộ mọi lần xuất hiện, chúng tôi tập trung vào các đầu truyện định hình tính cách, các cột mốc thay đổi nguồn gốc và những bộ truyện kinh điển nhất của từng nhân vật.</p>\n<p style="text-align: justify;">Bộ đếm số tập trong từng thứ tự đọc nhân vật không bao gồm các sự kiện lớn.</p>\n$3`
  );

  fs.writeFileSync(p, html, 'utf8');
  console.log('[OK] dc/characters/index.html');
}

// 5. marvel/event-timeline/index.html
{
  const p = path.join(rootDir, 'marvel/event-timeline/index.html');
  let html = fs.readFileSync(p, 'utf8');

  html = html.replace('<span><strong>Marvel Event Timeline</strong></span>', '<span><strong>Dòng Thời Gian Sự Kiện Marvel</strong></span>');
  html = html.replace('<title>Marvel Event Timeline - Comic Book Reading Orders</title>', '<title>Dòng Thời Gian Sự Kiện Marvel - Comic Book Reading Orders VN</title>');

  html = html.replace(
    /(<div id="x-section-2"[^>]*>[\s\S]*?<div id="" class="x-text mll mrl" >)([\s\S]*?)(<\/div><\/div><\/div><\/div>)/i,
    `$1<p style="text-align: justify;">Chào mừng bạn đến với Dòng Thời Gian Sự Kiện Marvel (Marvel Event Timeline). Đây là danh sách toàn bộ các sự kiện và crossover của Marvel được sắp xếp theo trình tự thời gian lịch sử vũ trụ (chronological order). Danh sách cũng bao gồm các biến cố lớn trong lịch sử Marvel diễn ra gói gọn trong một đầu truyện đơn lẻ như Infinity Gauntlet và Mutant Massacre.</p>\n$3`
  );

  fs.writeFileSync(p, html, 'utf8');
  console.log('[OK] marvel/event-timeline/index.html');
}

// 6. dc/event-timeline/index.html
{
  const p = path.join(rootDir, 'dc/event-timeline/index.html');
  let html = fs.readFileSync(p, 'utf8');

  html = html.replace('<span><strong>DC Event Timeline</strong></span>', '<span><strong>Dòng Thời Gian Sự Kiện DC</strong></span>');
  html = html.replace('<title>DC Event Timeline - Comic Book Reading Orders</title>', '<title>Dòng Thời Gian Sự Kiện DC - Comic Book Reading Orders VN</title>');

  html = html.replace(
    /(<div id="x-section-2"[^>]*>[\s\S]*?<div id="" class="x-text mll mrl" >)([\s\S]*?)(<\/div><\/div><\/div><\/div>)/i,
    `$1<p style="text-align: justify;">Chào mừng bạn đến với Dòng Thời Gian Sự Kiện DC Comics (DC Event Timeline). Đây là danh sách toàn bộ các sự kiện và crossover của DC Comics được sắp xếp theo trình tự thời gian lịch sử vũ trụ (chronological order). Danh sách cũng bao gồm các biến cố quan trọng trong lịch sử DC như 52 và Cosmic Odyssey.</p>\n$3`
  );

  fs.writeFileSync(p, html, 'utf8');
  console.log('[OK] dc/event-timeline/index.html');
}

// 7. other/index.html
{
  const p = path.join(rootDir, 'other/index.html');
  let html = fs.readFileSync(p, 'utf8');

  html = html.replace(
    /Starting in 2012 Valiant Entertainment started publishing new comics in a brand new continuity[\s\S]*?they are highly recommended\./i,
    'Bắt đầu từ năm 2012, Valiant Entertainment đã tái khởi động xuất bản các bộ truyện tranh trong một dòng thời gian hoàn toàn mới. Kể từ khi ra mắt, chất lượng các tác phẩm của Valiant luôn đạt mức rất cao và được cộng đồng độc giả đánh giá xuất sắc.'
  );

  fs.writeFileSync(p, html, 'utf8');
  console.log('[OK] other/index.html');
}

// 8. marvel/marvel-master-reading-order/index.html
{
  const p = path.join(rootDir, 'marvel/marvel-master-reading-order/index.html');
  let html = fs.readFileSync(p, 'utf8');

  html = html.replace('<span><strong>Marvel Master Reading Order</strong></span>', '<span><strong>Thứ Tự Đọc Marvel Toàn Diện (Master Reading Order)</strong></span>');
  html = html.replace(
    /Chào mừng đến với Lệnh đọc Marvel Master[\s\S]*?khuyên đọc\./i,
    'Chào mừng bạn đến với Thứ Tự Đọc Marvel Toàn Diện (Marvel Master Reading Order). Đây là lộ trình đọc quy mô nhất bao gồm tất cả các đầu truyện Marvel quan trọng và đặc sắc. Bắt đầu từ thời kỳ hiện đại (khoảng năm 2004 với sự kiện Avengers Disassembled) trở đi, bao quát toàn bộ các sự kiện crossover và các bộ truyện được đánh giá cao nhất.'
  );
  html = html.split('Lệnh đọc Marvel Master').join('Thứ Tự Đọc Marvel Toàn Diện');

  fs.writeFileSync(p, html, 'utf8');
  console.log('[OK] marvel/marvel-master-reading-order/index.html');
}

// 9. dc/dc-master-reading-order/index.html
{
  const p = path.join(rootDir, 'dc/dc-master-reading-order/index.html');
  let html = fs.readFileSync(p, 'utf8');

  html = html.replace('<span><strong>DC Master Reading Order</strong></span>', '<span><strong>Thứ Tự Đọc DC Toàn Diện (Master Reading Order)</strong></span>');
  html = html.replace(
    /Chào mừng bạn đến với Thứ tự đọc của DC Master[\s\S]*?được khuyên đọc\./i,
    'Chào mừng bạn đến với Thứ Tự Đọc DC Toàn Diện (DC Master Reading Order). Đây là lộ trình đọc đồ sộ bao gồm toàn bộ truyện tranh DC cốt lõi và các bộ truyện đặc sắc nhất qua các thời kỳ (Thời kỳ Vàng, Thời kỳ Bạc, Hậu Khủng hoảng Post-Crisis, New 52, DC Rebirth và Infinite Frontier).'
  );
  html = html.split('Thứ tự đọc của DC Master').join('Thứ Tự Đọc DC Toàn Diện');

  fs.writeFileSync(p, html, 'utf8');
  console.log('[OK] dc/dc-master-reading-order/index.html');
}

console.log('\n🎉 Hoàn thành Việt hóa sạch sẽ 9 trang Hub chính!');
