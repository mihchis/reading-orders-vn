const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'site', 'updates', 'index.html');
let html = fs.readFileSync(filePath, 'utf8');

console.log('🚀 Bắt đầu việt hóa toàn diện trang site/updates/index.html...');

// 1. Language attribute
html = html.replace(/<html class="no-js" lang="en-US">/g, '<html class="no-js" lang="vi">');

// 2. Head title & meta
html = html.replace(
  /<title>Comic Book Reading Orders Updates<\/title>/g,
  '<title>Nhật Ký Cập Nhật Thứ Tự Đọc | Comic Book Reading Orders VN</title>'
);
html = html.replace(
  /<meta name="description" content="Here you will find all the latest updates and corrections to all our reading orders." \/>/g,
  '<meta name="description" content="Tổng hợp tất cả các cập nhật, bổ sung và chỉnh sửa mới nhất cho các thứ tự đọc truyện tranh." />'
);
html = html.replace(
  /<meta property="og:title" content="Comic Book Reading Orders Updates" \/>/g,
  '<meta property="og:title" content="Nhật Ký Cập Nhật Thứ Tự Đọc | Comic Book Reading Orders VN" />'
);
html = html.replace(
  /<meta property="og:description" content="Here you will find all the latest updates and corrections to all our reading orders." \/>/g,
  '<meta property="og:description" content="Tổng hợp tất cả các cập nhật, bổ sung và chỉnh sửa mới nhất cho các thứ tự đọc truyện tranh." />'
);
html = html.replace(
  /<meta property="og:locale" content="en_US" \/>/g,
  '<meta property="og:locale" content="vi_VN" />'
);

// 3. Breadcrumb & Header
html = html.replace(
  /<span class="visually-hidden">Home<\/span>/g,
  '<span class="visually-hidden">Trang chủ</span>'
);
html = html.replace(
  /<a itemtype="http:\/\/schema\.org\/Thing" itemprop="item" href="index\.html" title="You Are Here" class="current "><span itemprop="name">Updates<\/span><\/a>/g,
  '<a itemtype="http://schema.org/Thing" itemprop="item" href="index.html" title="Bạn đang ở đây" class="current "><span itemprop="name">Cập Nhật</span></a>'
);

// 4. Main Page Headings & Intro
html = html.replace(
  /<span><strong>Site Updates<\/strong><\/span>/g,
  '<span><strong>Nhật Ký Cập Nhật</strong></span>'
);
html = html.replace(
  /<p style="text-align: justify;">This page will make a note of all updates to existing reading orders.  This way you can see what additions and corrections are made to any reading order you may be reading.<\/p>/g,
  '<p style="text-align: justify;">Trang này ghi nhận tất cả các cập nhật, bổ sung và chỉnh sửa đối với các thứ tự đọc hiện có. Nhờ đó, bạn có thể dễ dàng theo dõi những thay đổi hoặc tập truyện mới được cập nhật vào bộ truyện mình đang đọc.</p>'
);
html = html.replace(
  /<h2\s+class="h-custom-headline cs-ta-center mtn mbm h5"\s*><span><strong>Updates<\/strong><\/span><\/h2>/g,
  '<h2 class="h-custom-headline cs-ta-center mtn mbm h5"><span><strong>Danh Sách Cập Nhật</strong></span></h2>'
);

// 5. Accordion Months & Date Headings
const months = [
  { en: 'January', vi: 'Tháng 1' },
  { en: 'February', vi: 'Tháng 2' },
  { en: 'March', vi: 'Tháng 3' },
  { en: 'April', vi: 'Tháng 4' },
  { en: 'May', vi: 'Tháng 5' },
  { en: 'June', vi: 'Tháng 6' },
  { en: 'July', vi: 'Tháng 7' },
  { en: 'August', vi: 'Tháng 8' },
  { en: 'September', vi: 'Tháng 9' },
  { en: 'October', vi: 'Tháng 10' },
  { en: 'November', vi: 'Tháng 11' },
  { en: 'December', vi: 'Tháng 12' }
];

months.forEach(({ en, vi }) => {
  // Accordion toggle: <span>September 2026</span> -> <span>Tháng 9, 2026</span>
  const accRegex = new RegExp(`<span>${en} (\\d{4})<\\/span>`, 'g');
  html = html.replace(accRegex, `<span>${vi}, $1</span>`);

  // Date heading: <p><strong>September 15, 2026</strong></p> -> <p><strong>Ngày 15 tháng 9, 2026</strong></p>
  const dateRegex = new RegExp(`<p><strong>${en} (\\d{1,2}), (\\d{4})(.*?)<\\/strong><\\/p>`, 'g');
  html = html.replace(dateRegex, `<p><strong>Ngày $1 ${vi.toLowerCase()}, $2$3</strong></p>`);
});

// 6. Pre-cleaning fragmented HTML tags in updates (WordPress artifacts like <span>Ad</span><span>ded ...</span>)
html = html.replace(/<span>Ad<\/span><span>ded\s+/gi, '<span>Đã thêm ');
html = html.replace(/<span>A<\/span><span>dded\s+/gi, '<span>Đã thêm ');
html = html.replace(/<span>Remov<\/span><span>ed\s+/gi, '<span>Đã xóa ');

// 7. Helper function to translate item text
function translateItemText(text) {
  let s = text;

  // Exact phrases & multi-word structures
  s = s.replace(/Update page created\.\s*All updates from this date forward are included here\.?/gi, 'Khởi tạo trang cập nhật. Toàn bộ cập nhật từ thời điểm này trở đi sẽ được lưu trữ tại đây.');
  s = s.replace(/Counters are now working again site-wide\.?/gi, 'Bộ đếm tiến độ đọc đã hoạt động bình thường trở lại trên toàn trang web.');
  s = s.replace(/PATREON LAUNCH/gi, 'CHÍNH THỨC KHỞI CHẠY PATREON');

  // Specific single items
  s = s.replace(/House of X #1-6<\/span>\s*removed\.?/gi, 'House of X #1-6</span> – Đã xóa.');
  s = s.replace(/Powers of X #1-6<\/span>\s*removed\.?/gi, 'Powers of X #1-6</span> – Đã xóa.');
  s = s.replace(/House of X #1-6 removed\.?/gi, 'Đã xóa House of X #1-6.');
  s = s.replace(/Powers of X #1-6 removed\.?/gi, 'Đã xóa Powers of X #1-6.');
  s = s.replace(/Made separate reading orders for Scarlet Witch and Vision\.?/gi, 'Tách riêng thứ tự đọc cho Scarlet Witch và Vision.');
  s = s.replace(/Made separate reading orders for Iron Fist and Luke Cage\.?/gi, 'Tách riêng thứ tự đọc cho Iron Fist và Luke Cage.');
  s = s.replace(/Grouped the Spider-Man: Breakout limited series together\.?/gi, 'Gộp các tập miniseries Spider-Man: Breakout lại cùng nhau.');
  s = s.replace(/Grouped the Toxin limited series together\.?/gi, 'Gộp các tập miniseries Toxin lại cùng nhau.');
  s = s.replace(/Updated to the beginning of Marvel Legacy\.?/gi, 'Đã cập nhật đến giai đoạn khởi đầu Marvel Legacy.');
  s = s.replace(/Changed the Doctor Strange origin issue from Strange Tales #114 to #115\.?/gi, 'Đổi tập nguồn gốc Doctor Strange từ Strange Tales #114 sang #115.');
  s = s.replace(/Switched the order of (.*?) and (.*?)\.?/gi, 'Hoán đổi thứ tự của $1 và $2.');
  s = s.replace(/Reordered a large portion of the reading order after the\s+/gi, 'Sắp xếp lại phần lớn thứ tự đọc sau ');
  s = s.replace(/Reordered the Road to No Man(&#8217;|')s Land section\.?/gi, "Sắp xếp lại phần Road to No Man's Land.");
  s = s.replace(/Completely re-?ordered the event\.?/gi, 'Sắp xếp lại toàn bộ thứ tự sự kiện.');
  s = s.replace(/Reordered the event\.?/gi, 'Sắp xếp lại thứ tự sự kiện.');
  s = s.replace(/is completely reordered\.?/gi, 'đã được sắp xếp lại toàn bộ.');
  s = s.replace(/Completely redone\.?/gi, 'Đã được làm mới toàn bộ.');

  // Redundant / duplicate issues
  s = s.replace(/Removed redundant issues?\.?/gi, 'Đã xóa tập trùng lặp.');
  s = s.replace(/Duplicate issues? removed\.?/gi, 'Đã xóa tập trùng lặp.');
  s = s.replace(/(\d+)\s+duplicate issues?\.?/gi, '$1 tập trùng lặp.');
  s = s.replace(/duplicate issues?\.?/gi, 'tập trùng lặp.');

  // Reading order added / updated
  s = s.replace(/(?:<\/a>|\s+)\s*genre reading list added\.?/gi, '</a> – Đã thêm danh sách đọc theo thể loại.');
  s = s.replace(/(?:<\/a>|\s+)\s*reading list added\.?/gi, '</a> – Đã thêm danh sách đọc.');
  s = s.replace(/(?:<\/a>|\s+)\s*reading order is added\.?/gi, '</a> – Đã thêm thứ tự đọc.');
  s = s.replace(/(?:<\/a>|\s+)\s*reading order added\.?/gi, '</a> – Đã thêm thứ tự đọc.');
  s = s.replace(/(?:<\/a>|\s+)\s*reading order updated\.?/gi, '</a> – Đã cập nhật thứ tự đọc.');
  s = s.replace(/(?:<\/a>|\s+)\s*reading order is updated to the start of All-New,\s*All-?\s*Different Marvel\.?/gi, '</a> – Đã cập nhật thứ tự đọc đến giai đoạn khởi đầu All-New, All-Different Marvel.');
  s = s.replace(/(?:<\/a>|\s+)\s*reading order is updated to the start of DC Rebirth\.?/gi, '</a> – Đã cập nhật thứ tự đọc đến giai đoạn khởi đầu DC Rebirth.');

  // Master / Rebirth order added
  s = s.replace(/<\/a>\s+added\.?/gi, '</a> – Đã thêm thứ tự đọc.');
  s = s.replace(/^(Marvel Master Reading Order Part \d+) added\.?/gi, '$1 – Đã thêm thứ tự đọc.');
  s = s.replace(/^(DC Master Reading Order Part \d+) added\.?/gi, '$1 – Đã thêm thứ tự đọc.');
  s = s.replace(/^(DC Rebirth (?:Reading Order )?Part \d+) added\.?/gi, '$1 – Đã thêm thứ tự đọc.');

  // Issues added / removed count
  s = s.replace(/^(?:added|Added)\s+(\d+)\s+issues?\.?/gi, 'Đã thêm $1 tập truyện.');
  s = s.replace(/^(\d+)\s+issues added\.?/gi, 'Đã thêm $1 tập truyện.');

  // Legionnaires special
  s = s.replace(/Added the Legionnaires 3 limited series to the end of the order,?\s+rather then have it appear near the beginning of the Post-Crisis part of the DC Master Reading Order\.?/gi, 'Đã thêm miniseries Legionnaires 3 vào cuối thứ tự đọc, thay vì đặt ở gần phần đầu Post-Crisis của DC Master Reading Order.');

  // Positions:
  s = s.replace(/(?:\s*|&nbsp;|\u00a0)to the (?:start|beginning) of the order\.?/gi, ' lên đầu thứ tự đọc.');
  s = s.replace(/(?:\s*|&nbsp;|\u00a0)earlier in the order\.?/gi, ' lên trước trong thứ tự đọc.');
  s = s.replace(/(?:\s*|&nbsp;|\u00a0)earlier\.?/gi, ' lên trước.');
  s = s.replace(/(?:\s*|&nbsp;|\u00a0)later in the order\.?/gi, ' xuống sau trong thứ tự đọc.');
  s = s.replace(/(?:\s*|&nbsp;|\u00a0)moved xuống sau trong thứ tự đọc\.?/gi, ' đã được chuyển xuống sau trong thứ tự đọc.');
  s = s.replace(/(?:\s*|&nbsp;|\u00a0)moved after\s+/gi, ' đã được chuyển ra sau ');
  s = s.replace(/(?:\s*|&nbsp;|\u00a0)moved before\s+/gi, ' đã được chuyển lên trước ');
  s = s.replace(/(?:\s*|&nbsp;|\u00a0)right after #(\d+)\.?/gi, ' ra ngay sau tập #$1.');
  s = s.replace(/(?:\s*|&nbsp;|\u00a0)directly after\s+/gi, ' ra ngay sau ');

  // Event suffix
  s = s.replace(/:\s*Added the event\.?/gi, ': Đã thêm sự kiện.');
  s = s.replace(/:\s*Removed the event\.?/gi, ': Đã xóa sự kiện.');
  s = s.replace(/\s+event\./gi, '.');

  // Prefixes: Added, Removed, Moved, Move (with optional HTML wrapper)
  s = s.replace(/^Added\s+/gi, 'Đã thêm ');
  s = s.replace(/^Add\s+/gi, 'Đã thêm ');
  s = s.replace(/^Removed\s+/gi, 'Đã xóa ');
  s = s.replace(/^Remove\s+/gi, 'Đã xóa ');
  s = s.replace(/^Moved\s+/gi, 'Chuyển ');
  s = s.replace(/^Move\s+/gi, 'Chuyển ');

  // Inside tags: e.g. <span ...>Added ...</span> or <p>Added ...</p>
  s = s.replace(/(<(?:span|p)\b[^>]*>)\s*Added\s+/gi, '$1Đã thêm ');
  s = s.replace(/(<(?:span|p)\b[^>]*>)\s*Removed\s+/gi, '$1Đã xóa ');
  s = s.replace(/(<(?:span|p)\b[^>]*>)\s*Moved\s+/gi, '$1Chuyển ');

  // Specific phrases with "reading order"
  s = s.replace(/(?:Đã thêm|Added)\s+(.*?)\s+reading order\.?/gi, 'Đã thêm thứ tự đọc $1.');

  // Remaining "issues"
  s = s.replace(/(\d+)\s+issues\b/gi, '$1 tập truyện');
  s = s.replace(/(\d+)\s+issue\b/gi, '$1 tập truyện');
  s = s.replace(/Daredevil issues\.?/gi, 'các tập truyện Daredevil.');

  // Trailing cleanups
  s = s.replace(/redundant issue\.?/gi, 'tập trùng lặp.');

  return s;
}

// 8. Process all leaf <li> elements
html = html.replace(/<li>((?:(?!<ul>|<\/li>).)*)<\/li>/gs, (match, inner) => {
  return `<li>${translateItemText(inner)}</li>`;
});

// Write to file
fs.writeFileSync(filePath, html, 'utf8');
console.log('✅ Hoàn tất việt hóa toàn diện trang site/updates/index.html!');
