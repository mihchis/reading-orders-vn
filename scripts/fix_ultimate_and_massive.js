const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Fix Ultimate Universe using the exact clean structure from Invincible
const invHtml = fs.readFileSync(path.join(rootDir, 'other/invincible-reading-order/index.html'), 'utf8');
const uuPath = path.join(rootDir, 'marvel/events/ultimate-universe-reading-order/index.html');
let uuHtml = fs.readFileSync(uuPath, 'utf8');

// In Invincible: find from </header> down to </article>
const invMainStart = invHtml.indexOf('</header>');
const invMainEnd = invHtml.indexOf('</article>');
const invMainContent = invHtml.slice(invMainStart, invMainEnd);

// In Ultimate Universe: find </header> or the breadcrumbs end
// Note: UU had </header> missing or modified
const uuBreadcrumbEnd = uuHtml.indexOf('</div>\n    </div>');
const uuArticleEnd = uuHtml.indexOf('</article>');

// Let's inspect uu between breadcrumbEnd and articleEnd
// Keep Section 1, Section 2, Section 3, Section 4 of UU, but replace Section 5 with clean Section 5
const p1Card = `<div class="ro-coming-soon-card" style="text-align: center; padding: 40px 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; margin: 16px 0;">
  <p style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">Danh Sách Thứ Tự Đọc Đang Được Cập Nhật</p>
  <p style="font-size: 14px; color: #64748b; max-width: 580px; margin: 0 auto; line-height: 1.6;">
    Danh sách thứ tự đọc chi tiết cho <strong>Ultimate Universe</strong> hiện đang được ban quản trị biên tập và hệ thống hóa. Nội dung sẽ được cập nhật trong thời gian sớm nhất!
  </p>
</div>`;

const p2Card = `<div class="ro-coming-soon-card" style="text-align: center; padding: 28px 20px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; margin: 16px 0;">
  <p style="font-size: 14px; color: #64748b; margin: 0;">Tuyển tập (TPBs) đang được cập nhật.</p>
</div>`;

const cleanSec5 = `    <!-- Section 5: Hệ thống Tabs & Danh sách tập truyện chuẩn -->
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
${p1Card}
                  </div>
                </div>
                <div id="panel-reading-order-2" class="x-tabs-panel" role="tabpanel" aria-labelledby="tab-reading-order-2" aria-hidden="true" style="display: none;">
                  <div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">
${p2Card}
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
  </div>`;

// Replace from Section 5 start to article end in UU
const sec5StartUU = uuHtml.search(/(?:<!-- Section 5|<div class="x-section ro-reading-order-section)/i);
const afterArticleUU = uuHtml.search(/<footer class="x-colophon"/i);
let beforeSec5UU = uuHtml.slice(0, sec5StartUU).trimEnd();
const afterFooterUU = uuHtml.slice(afterArticleUU).trimStart();

// Check if header/x-main wrappers exist before Section 5
if (beforeSec5UU.includes('</div>  <div id="cs-content" class="cs-content">')) {
  beforeSec5UU = beforeSec5UU.replace(
    '</div>  <div id="cs-content" class="cs-content">',
    `</div>\n    </div>\n\n  </header>\n\n  <div id="x-main" class="x-main full" role="main" tabindex="-1">\n\n    <article id="post-7460" class="post-7460 page type-page status-publish hentry no-post-thumbnail">\n        \n<div class="entry-content content">\n\n  <div id="cs-content" class="cs-content">`
  );
} else if (!beforeSec5UU.includes('id="x-main"')) {
  // If breadcrumbs end directly at cs-content
  beforeSec5UU = beforeSec5UU.replace(
    /(<div class="x-breadcrumbs"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/i,
    `$1\n\n  </header>\n\n  <div id="x-main" class="x-main full" role="main" tabindex="-1">\n\n    <article id="post-7460" class="post-7460 page type-page status-publish hentry no-post-thumbnail">\n        \n<div class="entry-content content">\n\n  <div id="cs-content" class="cs-content">`
  );
}

uuHtml = `${beforeSec5UU}\n\n${cleanSec5}\n\n  <footer class="x-colophon" ${afterFooterUU.slice(26)}`;
// Add 1 missing closing div before </article>
uuHtml = uuHtml.replace('</article>', '</div>\n    </article>');
// Counter to 0
uuHtml = uuHtml.replace(/data-x-element-counter="[^"]*?"/g, 'data-x-element-counter="{&quot;to&quot;:&quot;0&quot;,&quot;speed&quot;:&quot;1.5s&quot;,&quot;commaSeparatedDecimal&quot;:false}"');
uuHtml = uuHtml.replace(/<div class="x-counter-after">[^<]*<\/div>/g, '<div class="x-counter-after">TẬP TRUYỆN • ĐANG CẬP NHẬT</div>');
fs.writeFileSync(uuPath, uuHtml, 'utf8');

// Check UU div balance
let bodyUU = uuHtml.slice(uuHtml.indexOf('<body'), uuHtml.indexOf('</body>'));
let opensUU = (bodyUU.match(/<div(\s|>)/gi) || []).length;
let closesUU = (bodyUU.match(/<\/div>/gi) || []).length;
console.log('UU div balance:', opensUU - closesUU, '(opens:', opensUU, 'closes:', closesUU, ')');

// 2. Fix The Massive-Verse
const mvPath = path.join(rootDir, 'other/the-massive-verse-reading-order/index.html');
let mvHtml = fs.readFileSync(mvPath, 'utf8');
let bodyMV = mvHtml.slice(mvHtml.indexOf('<body'), mvHtml.indexOf('</body>'));
let opensMV = (bodyMV.match(/<div(\s|>)/gi) || []).length;
let closesMV = (bodyMV.match(/<\/div>/gi) || []).length;
let diffMV = opensMV - closesMV;
if (diffMV !== 0) {
  if (diffMV < 0) {
    // Too many closing divs
    for (let i = 0; i < -diffMV; i++) {
      mvHtml = mvHtml.replace(/<\/div>(\s*<\/article>)/i, '$1');
    }
  } else {
    // Too few closing divs
    let closingTags = '';
    for (let i = 0; i < diffMV; i++) closingTags += '</div>\n';
    mvHtml = mvHtml.replace(/(\s*<\/article>)/i, `\n${closingTags}$1`);
  }
  fs.writeFileSync(mvPath, mvHtml, 'utf8');
}
bodyMV = mvHtml.slice(mvHtml.indexOf('<body'), mvHtml.indexOf('</body>'));
opensMV = (bodyMV.match(/<div(\s|>)/gi) || []).length;
closesMV = (bodyMV.match(/<\/div>/gi) || []).length;
console.log('Massive-Verse div balance:', opensMV - closesMV);
