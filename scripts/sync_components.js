const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const componentsDir = path.join(rootDir, 'components');

const headerNavComponentPath = path.join(componentsDir, 'header-nav.html');
const footerComponentPath = path.join(componentsDir, 'footer.html');
const overlaysComponentPath = path.join(componentsDir, 'overlays.html');
const footerScriptsComponentPath = path.join(componentsDir, 'footer-scripts.html');
const readingLegendComponentPath = path.join(componentsDir, 'reading-legend.html');

const headerNavContent = fs.existsSync(headerNavComponentPath) ? fs.readFileSync(headerNavComponentPath, 'utf8').trim() : '';
const footerContent = fs.existsSync(footerComponentPath) ? fs.readFileSync(footerComponentPath, 'utf8').trim() : '';
const overlaysContent = fs.existsSync(overlaysComponentPath) ? fs.readFileSync(overlaysComponentPath, 'utf8').trim() : '';
const footerScriptsContent = fs.existsSync(footerScriptsComponentPath) ? fs.readFileSync(footerScriptsComponentPath, 'utf8').trim() : '';
const readingLegendContent = fs.existsSync(readingLegendComponentPath) ? fs.readFileSync(readingLegendComponentPath, 'utf8').trim() : '';

// Regex khớp các khối component và mã thừa
const headerNavRegex = /<div class="x-logobar">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i;
const footerRegex = /<footer class="x-colophon"[\s\S]*?<\/footer>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/footer>/i;
const overlaysRegex = /<div class="x-searchform-overlay">[\s\S]*?<\/div>\s*<!-- END \.x-root -->/i;
const scriptsRegex = /<script type="speculationrules">[\s\S]*?<\/body>/i;

// Regex cho Bảng Legend, Yoast Schema và cs-page-css
const legendRegex = /<div class="x-section[^"]*?"[^>]*?>[\s\S]*?(?:Bộ truyện dài kỳ|Ongoing Series)[\s\S]*?(?:Ghi chú đọc|Comments)[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/i;
const yoastSchemaRegex = /<script type="application\/ld\+json" class="yoast-schema-graph">[\s\S]*?<\/script>/i;
const csPageCssRegex = /<style id="cs-page-css">[\s\S]*?<\/style>/i;

const excludedDirs = new Set([
  'node_modules',
  'dist',
  'archive',
  'tham_khao',
  '.git',
  'server',
  'scripts',
  'components',
  'site',
  '.system_generated'
]);

let updatedHeaderCount = 0;
let updatedFooterCount = 0;
let updatedOverlaysCount = 0;
let updatedScriptsCount = 0;
let updatedLegendCount = 0;
let updatedYoastCount = 0;
let updatedCsCssCount = 0;
let updatedPatreonCount = 0;
let updatedFilesCount = 0;
let totalHtmlCount = 0;

// Regex loại bỏ Patreon CSS/JS (plugin patron-plugin-pro)
const patreonCssRegex = /<link[^>]*patron[^>]*\/>/gi;
const patreonJsRegex = /<script[^>]*patron[^>]*><\/script>/gi;
const patreonExclusiveRegex = /This\s+reading\s+order\s+is\s+a\s+<a[^>]*>Patreon<\/a>\s+exclusive\.?/gi;
const patreonExclusiveViRegex = /Thứ\s+tự\s+đọc\s+này\s+dành\s+riêng\s+cho\s+người\s+ủng\s+hộ\s+trên\s+Patreon\./gi;
// Xóa ảnh banner Patreon (banner.jpg hoặc các ảnh quảng cáo Patreon)
const patreonBannerRegex = /<p>\s*<a[^>]*>\s*<img[^>]*(?:banner\.jpg|patreon)[^>]*\/>\s*<\/a>\s*<\/p>/gi;
const patreonFreeTextRegex = /Nội dung miễn phí — Xem tự do không giới hạn!\s*<\/strong>\s*<\/span>\s*<\/p>\s*<p>\s*<a[^>]*><img[^>]*\/><\/a>\s*<\/p>/gi;



function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!excludedDirs.has(entry.name)) {
        walkDir(path.join(dir, entry.name));
      }
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      totalHtmlCount++;
      const filePath = path.join(dir, entry.name);
      let content = fs.readFileSync(filePath, 'utf8');
      const original = content;
      let fileModified = false;

      // 1. Header Navigation
      if (headerNavContent && headerNavRegex.test(content)) {
        const replaced = content.replace(headerNavRegex, headerNavContent);
        if (replaced !== content) {
          content = replaced;
          updatedHeaderCount++;
          fileModified = true;
        }
      }

      // 2. Footer
      if (footerContent && footerRegex.test(content)) {
        const replaced = content.replace(footerRegex, footerContent);
        if (replaced !== content) {
          content = replaced;
          updatedFooterCount++;
          fileModified = true;
        }
      }

      // 3. Overlays
      if (overlaysContent && overlaysRegex.test(content)) {
        const replaced = content.replace(overlaysRegex, overlaysContent);
        if (replaced !== content) {
          content = replaced;
          updatedOverlaysCount++;
          fileModified = true;
        }
      }

      // 4. Footer Scripts
      if (footerScriptsContent && scriptsRegex.test(content)) {
        const replaced = content.replace(scriptsRegex, footerScriptsContent + '\n</body>');
        if (replaced !== content) {
          content = replaced;
          updatedScriptsCount++;
          fileModified = true;
        }
      }

      // 5. Dọn dẹp Yoast Schema JSON-LD rác
      if (yoastSchemaRegex.test(content)) {
        const replaced = content.replace(yoastSchemaRegex, '');
        if (replaced !== content) {
          content = replaced;
          updatedYoastCount++;
          fileModified = true;
        }
      }

      // 6. Chuyển CSS Inline cs-page-css ra ngoài (đã có trong wp-theme-layout.css)
      if (csPageCssRegex.test(content)) {
        const replaced = content.replace(csPageCssRegex, '');
        if (replaced !== content) {
          content = replaced;
          updatedCsCssCount++;
          fileModified = true;
        }
      }

      // 7. Xóa toàn bộ Patreon plugin CSS/JS và text paywall
      {
        let patreonModified = false;
        // Xóa <link> CSS của Patreon plugin
        let r = content.replace(patreonCssRegex, '');
        if (r !== content) { content = r; patreonModified = true; }
        // Xóa <script> JS của Patreon plugin
        r = content.replace(patreonJsRegex, '');
        if (r !== content) { content = r; patreonModified = true; }
        // Xóa các thông báo Patreon paywall cũ
        r = content.replace(patreonExclusiveRegex, '');
        if (r !== content) { content = r; patreonModified = true; }
        r = content.replace(patreonExclusiveViRegex, '');
        if (r !== content) { content = r; patreonModified = true; }
        // Xóa ảnh banner Patreon
        r = content.replace(patreonBannerRegex, '');
        if (r !== content) { content = r; patreonModified = true; }
        r = content.replace(patreonFreeTextRegex, '');
        if (r !== content) { content = r; patreonModified = true; }
        if (patreonModified) { updatedPatreonCount++; fileModified = true; }
      }

      if (fileModified && content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        updatedFilesCount++;
      }
    }
  }
}

console.log('🔄 Đang đồng bộ tất cả components và dọn dẹp mã lặp trên toàn bộ website...');
const startTime = Date.now();
walkDir(rootDir);
const duration = ((Date.now() - startTime) / 1000).toFixed(2);

console.log(`✅ Đồng bộ hoàn tất trong ${duration}s!`);
console.log(`📊 Tổng số trang HTML quét: ${totalHtmlCount}`);
console.log(`✨ Số file có cập nhật: ${updatedFilesCount}`);
console.log(`  - Header Nav: ${updatedHeaderCount}`);
console.log(`  - Footer: ${updatedFooterCount}`);
console.log(`  - Overlays: ${updatedOverlaysCount}`);
console.log(`  - Footer Scripts: ${updatedScriptsCount}`);
console.log(`  - Bảng Legend chuyển thành Component: ${updatedLegendCount}`);
console.log(`  - Thẻ Schema Yoast đã loại bỏ: ${updatedYoastCount}`);
console.log(`  - CSS inline cs-page-css đã loại bỏ: ${updatedCsCssCount}`);
console.log(`  - Patreon plugin đã xóa: ${updatedPatreonCount}`);
