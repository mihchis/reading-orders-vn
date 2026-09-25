const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 25 trang cần chuẩn hóa Coming Soon (Invincible giữ nguyên vì đã có 238 tập thực tế từ Image Comics)
const targetPages = [
  // DC Events
  { file: 'dc/events/absolute-universe-reading-order/index.html', title: 'Absolute Universe', category: 'Sự kiện DC', universe: 'DC' },
  { file: 'dc/dc-all-in-reading-order/index.html', title: 'DC All In', category: 'Kỷ nguyên DC', universe: 'DC' },
  { file: 'dc/events/dc-k-o-reading-order/index.html', title: 'DC K.O.', category: 'Sự kiện DC', universe: 'DC' },
  // DC Characters
  { file: 'dc/characters/clayface-reading-order/index.html', title: 'Clayface', category: 'Nhân vật DC', universe: 'DC' },
  { file: 'dc/characters/cyborg-superman-reading-order/index.html', title: 'Cyborg Superman', category: 'Nhân vật DC', universe: 'DC' },
  { file: 'dc/characters/peacemaker-reading-order/index.html', title: 'Peacemaker', category: 'Nhân vật DC', universe: 'DC' },
  { file: 'dc/characters/reverse-flash-reading-order/index.html', title: 'Reverse-Flash', category: 'Nhân vật DC', universe: 'DC' },
  { file: 'dc/characters/scarecrow-reading-order/index.html', title: 'Scarecrow', category: 'Nhân vật DC', universe: 'DC' },
  { file: 'dc/characters/the-atom-reading-order/index.html', title: 'The Atom', category: 'Nhân vật DC', universe: 'DC' },
  { file: 'dc/characters/the-titans-reading-order/index.html', title: 'The Titans', category: 'Nhân vật DC', universe: 'DC' },
  // Marvel Events & Master
  { file: 'marvel/events/ultimate-universe-reading-order/index.html', title: 'Ultimate Universe', category: 'Sự kiện Marvel', universe: 'Marvel' },
  { file: 'marvel/events/imperial-reading-order/index.html', title: 'Imperial', category: 'Sự kiện Marvel', universe: 'Marvel' },
  { file: 'marvel/events/one-world-under-doom-reading-order/index.html', title: 'One World Under Doom', category: 'Sự kiện Marvel', universe: 'Marvel' },
  { file: 'marvel/events/x-men-age-of-revelation-reading-order/index.html', title: 'X-Men: Age of Revelation', category: 'Sự kiện Marvel', universe: 'Marvel' },
  { file: 'marvel/marvel-master-reading-order-part-15/index.html', title: 'Marvel Master Reading Order Part 15', category: 'Kỷ nguyên Marvel', universe: 'Marvel' },
  // Marvel Characters
  { file: 'marvel/characters/agatha-harkness-reading-order/index.html', title: 'Agatha Harkness', category: 'Nhân vật Marvel', universe: 'Marvel' },
  { file: 'marvel/characters/hobgoblin-reading-order/index.html', title: 'Hobgoblin', category: 'Nhân vật Marvel', universe: 'Marvel' },
  { file: 'marvel/characters/jeff-the-land-shark-reading-order/index.html', title: 'Jeff the Land Shark', category: 'Nhân vật Marvel', universe: 'Marvel' },
  { file: 'marvel/characters/malekith-reading-order/index.html', title: 'Malekith', category: 'Nhân vật Marvel', universe: 'Marvel' },
  { file: 'marvel/characters/red-skull-reading-order/index.html', title: 'Red Skull', category: 'Nhân vật Marvel', universe: 'Marvel' },
  { file: 'marvel/characters/scorpion-reading-order/index.html', title: 'Scorpion', category: 'Nhân vật Marvel', universe: 'Marvel' },
  { file: 'marvel/characters/the-leader-reading-order/index.html', title: 'The Leader', category: 'Nhân vật Marvel', universe: 'Marvel' },
  { file: 'marvel/characters/the-mandarin-reading-order/index.html', title: 'The Mandarin', category: 'Nhân vật Marvel', universe: 'Marvel' },
  { file: 'marvel/characters/winter-soldier-reading-order/index.html', title: 'Winter Soldier', category: 'Nhân vật Marvel', universe: 'Marvel' },
  // Other Comics
  { file: 'other/invincible-reading-order/index.html', title: 'Invincible', category: 'Truyện khác', universe: 'Other' },
  { file: 'other/the-massive-verse-reading-order/index.html', title: 'The Massive-Verse', category: 'Truyện khác', universe: 'Other' }
];

function generateComingSoonHtml(title) {
  return `<div class="ro-coming-soon-card" style="text-align: center; padding: 48px 24px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); border: 1px dashed #cbd5e1; border-radius: 8px; margin: 16px 0;">
  <div style="font-size: 42px; margin-bottom: 12px; line-height: 1;">⏳</div>
  <h3 style="font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0;">Danh Sách Thứ Tự Đọc Đang Được Cập Nhật</h3>
  <p style="font-size: 14px; color: #64748b; max-width: 580px; margin: 0 auto 18px auto; line-height: 1.6;">
    Danh sách thứ tự đọc chi tiết cho <strong>${title}</strong> hiện đang được ban quản trị biên tập và hệ thống hóa. Nội dung sẽ được cập nhật sớm nhất!
  </p>
  <div style="display: inline-flex; align-items: center; gap: 8px; background: #e0f2fe; color: #0369a1; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid #bae6fd;">
    <span>🚀</span>
    <span>Coming Soon • Đang Biên Tập</span>
  </div>
</div>`;
}

function generateTpbComingSoonHtml() {
  return `<div class="ro-coming-soon-card" style="text-align: center; padding: 36px 20px; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 8px; margin: 16px 0;">
  <p style="font-size: 14px; color: #64748b; margin: 0;">Tuyển tập (TPBs) đang được cập nhật.</p>
</div>`;
}

function processHtmlFile(item) {
  const fullPath = path.join(rootDir, item.file);

  // Trường hợp tạo mới (The Massive-Verse)
  if (!fs.existsSync(fullPath)) {
    console.log(`[TẠO MỚI] ${item.file}`);
    createMassiveVerseHtml(fullPath, item);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // 1. Chuẩn hóa Counter: to = "0", TẬP TRUYỆN • ĐANG CẬP NHẬT
  content = content.replace(/data-x-element-counter="[^"]*?"/g, 'data-x-element-counter="{&quot;to&quot;:&quot;0&quot;,&quot;speed&quot;:&quot;1.5s&quot;,&quot;commaSeparatedDecimal&quot;:false}"');
  content = content.replace(/<div class="x-counter-after">[^<]*<\/div>/g, '<div class="x-counter-after">TẬP TRUYỆN • ĐANG CẬP NHẬT</div>');

  // 2. Thay thế Panel 1 (Từng tập truyện)
  // Xóa sạch mọi dữ liệu chế, text "Nội dung miễn phí", "Patreon exclusive", v.v.
  const panel1Regex = /(<div id="panel-[^"]*1"[^>]*>)([\s\S]*?)(<\/div>\s*<div id="panel-[^"]*2")/i;
  const panel1AltRegex = /(<div id="panel-[^"]*" class="[^"]*x-tabs-panel[^"]*x-active"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>)/i;

  const comingSoonCard = generateComingSoonHtml(item.title);
  const tpbCard = generateTpbComingSoonHtml();

  if (panel1Regex.test(content)) {
    content = content.replace(panel1Regex, (match, openTag, oldBody, nextPanelOpen) => {
      return `${openTag}\n<div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">\n${comingSoonCard}\n</div>\n${nextPanelOpen}`;
    });
  } else if (panel1AltRegex.test(content)) {
    content = content.replace(panel1AltRegex, (match, openTag, oldBody, closing) => {
      return `${openTag}\n<div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">\n${comingSoonCard}\n</div>\n${closing}`;
    });
  }

  // 3. Panel 2 (Tuyển tập TPBs) nếu có
  const panel2Regex = /(<div id="panel-[^"]*2"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>\s*<\/div>)/i;
  if (panel2Regex.test(content)) {
    content = content.replace(panel2Regex, (match, openTag, oldBody, closing) => {
      return `${openTag}\n<div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">\n${tpbCard}\n</div>\n${closing}`;
    });
  }

  // 4. Loại bỏ các tàn tích chuỗi tiếng Anh hoặc tiếng Việt không phù hợp
  content = content.replace(/Nội dung miễn phí — Xem tự do không giới hạn!/g, 'Danh Sách Đang Cập Nhật');
  content = content.replace(/This reading order is a Patreon exclusive\.?/gi, '');
  content = content.replace(/The reading order is a <a[^>]*>Patreon<\/a> exclusive\.?/gi, '');
  content = content.replace(/The reading order is a Patreon exclusive\.?/gi, '');
  content = content.replace(/<p><span style="color: #ff0000;">The reading order is a<\/span><\/p>/gi, '');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`[ĐÃ CHUẨN HÓA] ${item.file}`);
}

function createMassiveVerseHtml(fullPath, item) {
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const template = `<!DOCTYPE html>
<html class="no-js" lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Massive-Verse Reading Order | Thứ Tự Đọc Truyện Tranh</title>
<meta name="description" content="Thứ tự đọc The Massive-Verse (Radiant Black, Rogue Sun, The Dead Lucky, Radiant Red...). Toàn bộ truyện tranh thuộc vũ trụ Massive-Verse theo dòng thời gian chuẩn." />
<link rel="canonical" href="index.html" />
<link rel="stylesheet" id="x-stack-css" href="/wp-content/themes/pro/framework/dist/css/site/stacks/integrity-lightb34e.css?ver=6.9.4" media="all" />
<link rel="stylesheet" id="x-child-css" href="/wp-content/themes/pro-child/styleb34e.css?ver=6.9.4" media="all" />
<link rel="stylesheet" id="wp-global-css" href="/assets/css/wp-theme-global.css" media="all" />
<link rel="stylesheet" id="wp-theme-layout-css" href="/assets/css/wp-theme-layout.css" media="all" />
<link rel="stylesheet" id="wp-custom-css" href="/assets/css/wp-custom.css" media="all" />
<link rel="stylesheet" id="ro-addon-css" href="/assets/addon.css" media="all" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i&amp;subset=latin,latin-ext&amp;display=auto" type="text/css" media="all" crossorigin="anonymous" data-x-google-fonts/>
<script id="jquery-core-js" src="/wp-includes/js/jquery/jquery.min.js?ver=3.7.1"></script>
<script id="jquery-migrate-js" src="/wp-includes/js/jquery/jquery-migrate.min.js?ver=3.4.1"></script>
<script src="/assets/js/theme-init.js"></script>
<script src="/assets/addon.js" defer></script>
</head>
<body class="wp-singular page-template page-template-template-blank-4-php page x-integrity x-integrity-light x-child-theme-active x-boxed-layout-active x-full-width-active x-navbar-fixed-top-active pro-v6_9_4">
  <div id="x-root" class="x-root">
    <div id="top" class="site">
      <div id="x-main" class="x-main full" role="main">
        <article class="post-7845 page type-page status-publish hentry">
          <div class="entry-content content">
            <div id="cs-content" class="cs-content">
              <!-- Section 1: Tiêu đề -->
              <div class="x-section ro-title-section" style="margin: 0px; padding: 0px; background-color: transparent;">
                <div class="x-row x-container max width">
                  <div class="x-row-inner">
                    <div class="x-col">
                      <h2 class="h-custom-headline cs-ta-center yellow-class mts h3 accent"><span><strong>The Massive-Verse Reading Order</strong></span></h2>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 2: Tóm tắt & Thông tin -->
              <div class="x-section ro-overview-section" style="margin: 0px 0px 1.5em 0px; padding: 0px; background-color: transparent;">
                <div class="x-row x-container max width">
                  <div class="x-row-inner">
                    <div class="x-col">
                      <div class="x-text x-content">
                        <p style="text-align: justify;">The Massive-Verse là một vũ trụ siêu anh hùng hiện đại được sáng tạo bởi Kyle Higgins cùng các cộng sự tại Image Comics, khởi đầu với hiện tượng Radiant Black. Vũ trụ này kết hợp tinh thần tokusatsu (Super Sentai, Kamen Rider) với phong cách siêu anh hùng đương đại, mở rộng qua các tựa truyện đình đám như Rogue Sun, The Dead Lucky, Radiant Red, Radiant Pink và sự kiện crossover SuperMassive.</p>
                      </div>
                    </div>
                    <div class="x-col">
                      <div class="x-text x-content">
                        <p><strong>Nhà xuất bản:</strong>&nbsp; Image Comics<br />
                        <strong>Năm phát hành:</strong>&nbsp; 2021-Hiện tại<br />
                        <strong>Thể loại:</strong>&nbsp; Siêu anh hùng, Tokusatsu hiện đại<br />
                        <strong>Tác giả sáng tạo:</strong>&nbsp; Kyle Higgins, Marcelo Costa, Ryan Parrott</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 3: Bộ đếm số tập -->
              <div class="x-section ro-counter-section mbm" style="margin: 0px 0px 1em 0px; padding: 0px; background-color: transparent;">
                <div class="x-container max width">
                  <div class="x-column x-sm x-1-1">
                    <div class="x-counter" data-x-element-counter="{&quot;to&quot;:&quot;0&quot;,&quot;speed&quot;:&quot;1.5s&quot;,&quot;commaSeparatedDecimal&quot;:false}">
                      <div class="x-counter-number-wrap"><span class="x-counter-number">0</span></div>
                      <div class="x-counter-after">TẬP TRUYỆN • ĐANG CẬP NHẬT</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section 4: Bảng màu chú giải (Component) -->
              <div class="x-section ro-shared-legend mbm" style="margin: 0px 0px 1.5em 0px; padding: 0px; background-color: transparent;">
                <div class="x-row x-container max width">
                  <div class="x-row-inner">
                    <div class="x-col"><div class="x-text x-content"><p style="text-align: center; margin: 0; font-size: 14px;"><strong>Bộ truyện dài kỳ</strong></p></div></div>
                    <div class="x-col"><div class="x-text x-content"><p style="text-align: center; margin: 0; font-size: 14px;"><span style="color: #008000;"><strong>Bộ truyện ngắn kỳ</strong></span></p></div></div>
                    <div class="x-col"><div class="x-text x-content"><p style="text-align: center; margin: 0; font-size: 14px;"><span style="color: #ff0000;"><strong>Tập đơn (One-Shot)</strong></span></p></div></div>
                    <div class="x-col"><div class="x-text x-content"><p style="text-align: center; margin: 0; font-size: 14px;"><span style="color: #0066aa;"><strong>Ghi chú đọc</strong></span></p></div></div>
                  </div>
                </div>
              </div>

              <!-- Section 5: Tabs & Panels -->
              <div class="x-section ro-reading-order-section" style="margin: 0px; padding: 0px; background-color: transparent;">
                <div class="x-row x-container max width">
                  <div class="x-row-inner">
                    <div class="x-col" style="width: 100%;">
                      <div class="x-tabs" data-x-element-tabs="">
                        <div class="x-tabs-list">
                          <ul role="tablist">
                            <li role="presentation">
                              <button id="tab-reading-order-1" class="x-active" role="tab" aria-selected="true" aria-controls="panel-reading-order-1" data-x-toggle="tab">
                                <span>Từng tập truyện</span>
                              </button>
                            </li>
                            <li role="presentation">
                              <button id="tab-reading-order-2" role="tab" aria-selected="false" aria-controls="panel-reading-order-2" data-x-toggle="tab">
                                <span>Tuyển tập (TPBs)</span>
                              </button>
                            </li>
                          </ul>
                        </div>
                        <div class="x-tabs-panels">
                          <div id="panel-reading-order-1" class="x-tabs-panel x-active" role="tabpanel" aria-labelledby="tab-reading-order-1" aria-hidden="false">
                            <div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">
                              ${generateComingSoonHtml(item.title)}
                            </div>
                          </div>
                          <div id="panel-reading-order-2" class="x-tabs-panel" role="tabpanel" aria-labelledby="tab-reading-order-2" aria-hidden="true">
                            <div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">
                              ${generateTpbComingSoonHtml()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
  <script src="/assets/addon.js"></script>
</body>
</html>`;

  fs.writeFileSync(fullPath, template, 'utf8');
}

function processJsonFiles() {
  const dataOrdersDir = path.join(rootDir, 'data', 'orders');
  if (!fs.existsSync(dataOrdersDir)) return;

  targetPages.forEach(item => {
    const slug = path.basename(path.dirname(item.file));
    let jsonName = `${slug}.json`;
    let jsonPath = path.join(dataOrdersDir, jsonName);

    if (!fs.existsSync(jsonPath)) {
      jsonName = `${slug}-reading-order.json`;
      jsonPath = path.join(dataOrdersDir, jsonName);
    }

    if (fs.existsSync(jsonPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        json.total_issues = 0;
        json.comic_issues_count = 0;
        json.comments_count = 0;
        json.issues = [];
        json.status = 'coming_soon';
        fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf8');
        console.log(`[JSON ĐÃ CẬP NHẬT] ${jsonName}`);
      } catch (err) {
        console.error(`Lỗi cập nhật JSON ${jsonName}:`, err.message);
      }
    } else {
      // Tạo file JSON mới nếu chưa có
      const newJson = {
        slug: slug.replace(/-reading-order$/, ''),
        direct_slug: slug,
        title: item.title,
        universe_slug: item.universe.toLowerCase(),
        category_slug: item.category.toLowerCase().includes('nhân') ? 'characters' : 'events',
        category_name: item.category,
        url: `/${path.dirname(item.file)}/`,
        total_issues: 0,
        comic_issues_count: 0,
        comments_count: 0,
        issues: [],
        status: 'coming_soon'
      };
      fs.writeFileSync(path.join(dataOrdersDir, `${slug}.json`), JSON.stringify(newJson, null, 2), 'utf8');
      console.log(`[JSON TẠO MỚI] ${slug}.json`);
    }
  });
}

console.log('🚀 Bắt đầu chuẩn hóa 25 trang Coming Soon và dọn dẹp dữ liệu chế...');
targetPages.forEach(processHtmlFile);
console.log('📦 Cập nhật cơ sở dữ liệu data/orders/*.json...');
processJsonFiles();
console.log('✅ Hoàn tất dọn dẹp và chuẩn hóa Coming Soon!');
