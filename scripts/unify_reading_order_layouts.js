const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const legendComponentPath = path.join(rootDir, 'components', 'reading-legend.html');
const sharedLegend = fs.existsSync(legendComponentPath) 
  ? fs.readFileSync(legendComponentPath, 'utf8').trim()
  : `<div class="x-section ro-shared-legend mbm" style="margin: 0px 0px 1.5em 0px; padding: 0px; background-color: transparent;">
  <div class="x-row x-container max width">
    <div class="x-row-inner">
      <div class="x-col"><div class="x-text x-content"><p style="text-align: center; margin: 0; font-size: 14px;"><strong>Bộ truyện dài kỳ</strong></p></div></div>
      <div class="x-col"><div class="x-text x-content"><p style="text-align: center; margin: 0; font-size: 14px;"><span style="color: #008000;"><strong>Bộ truyện ngắn kỳ</strong></span></p></div></div>
      <div class="x-col"><div class="x-text x-content"><p style="text-align: center; margin: 0; font-size: 14px;"><span style="color: #ff0000;"><strong>Tập đơn (One-Shot)</strong></span></p></div></div>
      <div class="x-col"><div class="x-text x-content"><p style="text-align: center; margin: 0; font-size: 14px;"><span style="color: #0066aa;"><strong>Ghi chú đọc</strong></span></p></div></div>
    </div>
  </div>
</div>`;

function isTargetReadingOrder(filePath, content) {
  const norm = filePath.replace(/\\/g, '/');
  if (!norm.includes('/marvel/') && !norm.includes('/dc/') && !norm.includes('/other/')) return false;
  if (norm.endsWith('/events/index.html') || norm.endsWith('/characters/index.html') || norm.endsWith('/marvel/index.html') || norm.endsWith('/dc/index.html') || norm.endsWith('/other/index.html') || norm.includes('event-timeline')) return false;
  
  // Kiểm tra nếu là trang reading order đời cũ (chưa có x-tabs hoặc có margin-left: 100px)
  const isRo = content.includes('Reading Order') || content.includes('reading-order') || content.includes('reading-list');
  const needsTabs = !content.includes('x-tabs');
  const hasOldMargin = content.includes('margin-left:100px') || content.includes('margin-left: 100px') || content.includes('margin-left:80px') || content.includes('margin-left: 80px');
  
  return isRo && (needsTabs || hasOldMargin);
}

function translateMetadata(metaHtml) {
  return metaHtml
    .replace(/<strong>\s*Year Published\s*<\/strong>\s*:/gi, '<strong>Năm xuất bản:</strong>')
    .replace(/<strong>\s*Featured Characters\s*<\/strong>\s*:/gi, '<strong>Nhân vật nổi bật:</strong>')
    .replace(/<strong>\s*Previous Event\s*<\/strong>\s*:/gi, '<strong>Sự kiện trước:</strong>')
    .replace(/<strong>\s*Next Event\s*<\/strong>\s*:/gi, '<strong>Sự kiện tiếp theo:</strong>')
    .replace(/<strong>\s*First Appearance\s*<\/strong>\s*:/gi, '<strong>Xuất hiện lần đầu:</strong>')
    .replace(/<strong>\s*Key Storylines\s*<\/strong>\s*:/gi, '<strong>Cốt truyện chính:</strong>')
    .replace(/<strong>\s*Aliases\s*<\/strong>\s*:/gi, '<strong>Bí danh:</strong>')
    .replace(/<strong>\s*Powers\s*<\/strong>\s*:/gi, '<strong>Năng lực:</strong>');
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!isTargetReadingOrder(filePath, content)) return false;

  const csContentMatch = content.match(/<div id="cs-content" class="cs-content">([\s\S]*?)<\/div>\s*<\/div>\s*<\/article>/i);
  if (!csContentMatch) return false;

  const innerCs = csContentMatch[1];

  // 1. Trích xuất Headline (Section 1)
  let headlineHtml = '';
  const headMatch = innerCs.match(/<h2[^>]*class="[^"]*h-custom-headline[^"]*"[^>]*>[\s\S]*?<\/h2>/i);
  if (headMatch) {
    headlineHtml = headMatch[0];
  } else {
    const anyH2 = innerCs.match(/<h2[^>]*>[\s\S]*?<\/h2>/i);
    headlineHtml = anyH2 ? anyH2[0] : '<h2 class="h-custom-headline cs-ta-center red-class mts h3 accent"><span><strong>Reading Order</strong></span></h2>';
  }

  // 2. Trích xuất Overview & Metadata (Section 2)
  let overviewHtml = '';
  let metadataHtml = '';

  const section2Match = innerCs.match(/<div id="x-section-2"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i);
  if (section2Match) {
    const s2 = section2Match[0];
    const cols = s2.match(/<div\s+class="x-column[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi) || [];
    if (cols.length >= 2) {
      overviewHtml = cols[0].replace(/<div\s+class="x-column[^"]*"[^>]*>/i, '').replace(/<div[^>]*class="x-text[^"]*"[^>]*>/i, '').replace(/<\/div>\s*<\/div>$/i, '').trim();
      metadataHtml = cols[1].replace(/<div\s+class="x-column[^"]*"[^>]*>/i, '').replace(/<div[^>]*class="x-text[^"]*"[^>]*>/i, '').replace(/<\/div>\s*<\/div>$/i, '').trim();
    } else {
      // Tìm khối paragraph
      const ps = s2.match(/<p[\s\S]*?<\/p>/gi) || [];
      if (ps.length >= 2) {
        overviewHtml = ps[0];
        metadataHtml = ps.slice(1).join('\n');
      }
    }
  }

  metadataHtml = translateMetadata(metadataHtml);

  // 3. Trích xuất Counter
  let counterTo = '0';
  const counterMatch = innerCs.match(/data-x-element-counter="[^"]*?&quot;to&quot;:&quot;(\d+)&quot;/i)
    || innerCs.match(/"to":\s*"?(\d+)"?/i)
    || innerCs.match(/<span class="number">(\d+)<\/span>/i);
  if (counterMatch) {
    counterTo = counterMatch[1];
  }

  // 4. Trích xuất Reading Order Issues (Section 6 hoặc sau Reading Order)
  let issuesContent = '';
  
  let roStartIdx = -1;
  const roHeaderMatch = innerCs.match(/Reading Order[\s\S]*?<\/h2>/i);
  if (roHeaderMatch) {
    roStartIdx = innerCs.indexOf(roHeaderMatch[0]) + roHeaderMatch[0].length;
  } else {
    const s6Idx = innerCs.indexOf('id="x-section-6"');
    if (s6Idx !== -1) roStartIdx = s6Idx;
  }

  if (roStartIdx !== -1) {
    issuesContent = innerCs.substring(roStartIdx);
    // Bỏ thẻ đóng thừa ở cuối nếu có
    issuesContent = issuesContent
      .replace(/^[\s\S]*?<div[^>]*class="x-text[^"]*"[^>]*>/i, '')
      .replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*$/i, '')
      .replace(/<\/div>\s*<\/div>\s*<\/div>\s*$/i, '')
      .replace(/<\/div>\s*<\/div>\s*$/i, '')
      .trim();
  }

  if (!issuesContent) return false;

  // Xóa các style lề 100px trong issuesContent nếu còn sót
  issuesContent = issuesContent.replace(/margin-left:\s*100px;?\s*/gi, '')
                               .replace(/margin-right:\s*100px;?\s*/gi, '');

  // Việt hoá nút accordion "Click here to expand"
  issuesContent = issuesContent.replace(/Click here to expand/gi, 'Bấm vào đây để mở rộng danh sách')
                               .replace(/Click here to collapse/gi, 'Bấm vào đây để thu gọn danh sách');

  // Xây dựng lại #cs-content hoàn chỉnh theo Marvel 2099 Standard
  const newCsContent = `
  <div id="cs-content" class="cs-content">
    <!-- Section 1: Tiêu đề -->
    <div class="x-section ro-title-section" style="margin: 0px; padding: 0px; background-color: transparent;">
      <div class="x-row x-container max width">
        <div class="x-row-inner">
          <div class="x-col">
            ${headlineHtml}
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
              ${overviewHtml || '<p style="text-align: justify;">Thứ tự đọc chi tiết trọn bộ theo trình tự thời gian chuẩn xác.</p>'}
            </div>
          </div>
          <div class="x-col">
            <div class="x-text x-content">
              ${metadataHtml}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Bộ đếm số tập -->
    <div class="x-section ro-counter-section mbm" style="margin: 0px 0px 1em 0px; padding: 0px; background-color: transparent;">
      <div class="x-container max width">
        <div class="x-column x-sm x-1-1">
          <div class="x-counter" data-x-element-counter="{&quot;to&quot;:&quot;${counterTo}&quot;,&quot;speed&quot;:&quot;1.5s&quot;,&quot;commaSeparatedDecimal&quot;:false}">
            <div class="x-counter-number-wrap"><span class="x-counter-number">0</span></div>
            <div class="x-counter-after">TẬP TRUYỆN</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Bảng màu chú giải (Component) -->
    ${sharedLegend}

    <!-- Section 5: Hệ thống Tabs & Danh sách tập truyện chuẩn -->
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
                </ul>
              </div>
              <div class="x-tabs-panels">
                <div id="panel-reading-order-1" class="x-tabs-panel x-active" role="tabpanel" aria-labelledby="tab-reading-order-1" aria-hidden="false">
                  <div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">
                    ${issuesContent}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  const newFullContent = content.replace(/<div id="cs-content" class="cs-content">[\s\S]*?<\/div>\s*<\/div>\s*<\/article>/i, `${newCsContent}\n</div>\n</article>`);
  
  fs.writeFileSync(filePath, newFullContent, 'utf8');
  return true;
}

let modifiedCount = 0;
function scanAndProcess(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'tham_khao', 'dist'].includes(entry.name)) {
        scanAndProcess(fullPath);
      }
    } else if (entry.name === 'index.html') {
      if (processFile(fullPath)) {
        modifiedCount++;
        const rel = path.relative(rootDir, fullPath).replace(/\\/g, '/');
        console.log(`[Đã chuẩn hóa] ${rel}`);
      }
    }
  }
}

console.log('🚀 Bắt đầu quét và chuẩn hóa layout reading orders theo chuẩn Marvel 2099...');
scanAndProcess(rootDir);
console.log(`✅ Hoàn tất! Tổng số trang được nâng cấp chuẩn hóa: ${modifiedCount} trang.`);
