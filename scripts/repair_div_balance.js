const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const files = [
  'dc/events/absolute-universe-reading-order/index.html',
  'dc/dc-all-in-reading-order/index.html',
  'dc/events/dc-k-o-reading-order/index.html',
  'dc/characters/clayface-reading-order/index.html',
  'dc/characters/cyborg-superman-reading-order/index.html',
  'dc/characters/peacemaker-reading-order/index.html',
  'dc/characters/reverse-flash-reading-order/index.html',
  'dc/characters/scarecrow-reading-order/index.html',
  'dc/characters/the-atom-reading-order/index.html',
  'dc/characters/the-titans-reading-order/index.html',
  'marvel/events/ultimate-universe-reading-order/index.html',
  'marvel/events/imperial-reading-order/index.html',
  'marvel/events/one-world-under-doom-reading-order/index.html',
  'marvel/events/x-men-age-of-revelation-reading-order/index.html',
  'marvel/marvel-master-reading-order-part-15/index.html',
  'marvel/characters/agatha-harkness-reading-order/index.html',
  'marvel/characters/hobgoblin-reading-order/index.html',
  'marvel/characters/jeff-the-land-shark-reading-order/index.html',
  'marvel/characters/malekith-reading-order/index.html',
  'marvel/characters/red-skull-reading-order/index.html',
  'marvel/characters/scorpion-reading-order/index.html',
  'marvel/characters/the-leader-reading-order/index.html',
  'marvel/characters/the-mandarin-reading-order/index.html',
  'marvel/characters/winter-soldier-reading-order/index.html',
  'other/invincible-reading-order/index.html',
  'other/the-massive-verse-reading-order/index.html'
];

function buildStandardSection5(title) {
  return `    <!-- Section 5: Hệ thống Tabs & Danh sách tập truyện chuẩn -->
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
                    <div class="ro-coming-soon-card" style="text-align: center; padding: 48px 24px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); border: 1px dashed #cbd5e1; border-radius: 8px; margin: 16px 0;">
                      <div style="font-size: 42px; margin-bottom: 12px; line-height: 1;">⏳</div>
                      <h3 style="font-size: 20px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0;">Danh Sách Thứ Tự Đọc Đang Được Cập Nhật</h3>
                      <p style="font-size: 14px; color: #64748b; max-width: 580px; margin: 0 auto 18px auto; line-height: 1.6;">
                        Danh sách thứ tự đọc chi tiết cho <strong>${title}</strong> hiện đang được ban quản trị biên tập và hệ thống hóa. Nội dung sẽ được cập nhật sớm nhất!
                      </p>
                      <div style="display: inline-flex; align-items: center; gap: 8px; background: #e0f2fe; color: #0369a1; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid #bae6fd;">
                        <span>🚀</span>
                        <span>Coming Soon • Đang Biên Tập</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div id="panel-reading-order-2" class="x-tabs-panel" role="tabpanel" aria-labelledby="tab-reading-order-2" aria-hidden="true" style="display: none;">
                  <div class="x-text x-content" style="padding: 1.5rem 30px; text-align: left;">
                    <div class="ro-coming-soon-card" style="text-align: center; padding: 36px 20px; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 8px; margin: 16px 0;">
                      <p style="font-size: 14px; color: #64748b; margin: 0;">Tuyển tập (TPBs) đang được cập nhật.</p>
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
</div>
    </article>
  </div>`;
}

const titles = {
  'dc/events/absolute-universe-reading-order/index.html': 'Absolute Universe',
  'dc/dc-all-in-reading-order/index.html': 'DC All In',
  'dc/events/dc-k-o-reading-order/index.html': 'DC K.O.',
  'dc/characters/clayface-reading-order/index.html': 'Clayface',
  'dc/characters/cyborg-superman-reading-order/index.html': 'Cyborg Superman',
  'dc/characters/peacemaker-reading-order/index.html': 'Peacemaker',
  'dc/characters/reverse-flash-reading-order/index.html': 'Reverse-Flash',
  'dc/characters/scarecrow-reading-order/index.html': 'Scarecrow',
  'dc/characters/the-atom-reading-order/index.html': 'The Atom',
  'dc/characters/the-titans-reading-order/index.html': 'The Titans',
  'marvel/events/ultimate-universe-reading-order/index.html': 'Ultimate Universe',
  'marvel/events/imperial-reading-order/index.html': 'Imperial',
  'marvel/events/one-world-under-doom-reading-order/index.html': 'One World Under Doom',
  'marvel/events/x-men-age-of-revelation-reading-order/index.html': 'X-Men: Age of Revelation',
  'marvel/marvel-master-reading-order-part-15/index.html': 'Marvel Master Reading Order Part 15',
  'marvel/characters/agatha-harkness-reading-order/index.html': 'Agatha Harkness',
  'marvel/characters/hobgoblin-reading-order/index.html': 'Hobgoblin',
  'marvel/characters/jeff-the-land-shark-reading-order/index.html': 'Jeff the Land Shark',
  'marvel/characters/malekith-reading-order/index.html': 'Malekith',
  'marvel/characters/red-skull-reading-order/index.html': 'Red Skull',
  'marvel/characters/scorpion-reading-order/index.html': 'Scorpion',
  'marvel/characters/the-leader-reading-order/index.html': 'The Leader',
  'marvel/characters/the-mandarin-reading-order/index.html': 'The Mandarin',
  'marvel/characters/winter-soldier-reading-order/index.html': 'Winter Soldier',
  'other/invincible-reading-order/index.html': 'Invincible',
  'other/the-massive-verse-reading-order/index.html': 'The Massive-Verse'
};

for (const relPath of files) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');
  const title = titles[relPath] || 'Reading Order';

  const sec5Match = content.search(/(?:<!-- Section 5|\bclass="[^"]*ro-reading-order-section|\bclass="x-tabs)/i);
  const footerMatch = content.search(/<footer class="x-colophon" role="contentinfo">/i);

  if (sec5Match === -1 || footerMatch === -1) {
    console.error(`SKIP: ${relPath}`);
    continue;
  }

  const beforeSec5 = content.slice(0, sec5Match);
  const afterFooter = content.slice(footerMatch);

  const cleanSec5 = buildStandardSection5(title);

  const newContent = `${beforeSec5.trimEnd()}\n\n${cleanSec5}\n\n  ${afterFooter.trimStart()}`;
  fs.writeFileSync(fullPath, newContent, 'utf8');

  const body = newContent.slice(newContent.indexOf('<body'), newContent.indexOf('</body>'));
  const opens = (body.match(/<div(\s|>)/gi) || []).length;
  const closes = (body.match(/<\/div>/gi) || []).length;
  console.log(`${relPath} -> opens: ${opens}, closes: ${closes}, diff: ${opens - closes}`);
}
