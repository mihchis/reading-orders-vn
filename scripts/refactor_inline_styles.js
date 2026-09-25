const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// CLI Args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const singleFileArgIdx = args.indexOf('--file');
const singleFilePath = singleFileArgIdx !== -1 ? args[singleFileArgIdx + 1] : null;

// Thư mục cần quét
const scanDirs = ['marvel', 'dc', 'other'];

// Regex khớp các thành phần một cách an toàn tuyệt đối
const miniSpanRegex = /<span\s+style="color:\s*#008000;?">/gi;
const oneshotSpanRegex = /<span\s+style="color:\s*(?:#ff0000|red);?">/gi;
const phaseSpanRegex = /<span\s+style="color:\s*#0066aa;?">/gi;
const noteSpanRegex = /<span\s+style="color:\s*(?:#0000ff|blue);?">/gi;

const tabContentRegex = /<div class="x-text x-content"\s+style="padding:\s*1\.5rem\s+30px;\s*text-align:\s*left;">/gi;
const emptyTpbRegex = /<p\s+style="color:\s*#64748b;\s*font-style:\s*italic;">\s*Chưa có tuyển tập \(TPBs\)\.\s*<\/p>/gi;

// Section clean
const counterCleanRegex = /<div class="x-section ro-counter-section mbm"\s+style="margin:\s*0px 0px 1em 0px;\s*padding:\s*0px;\s*background-color:\s*transparent;">/gi;
const roSectionCleanRegex = /<div class="x-section ro-reading-order-section"\s+style="margin:\s*0px;\s*padding:\s*0px;\s*background-color:\s*transparent;">/gi;
const roSharedLegendCleanRegex = /<div class="x-section ro-shared-legend mbm"\s+style="margin:\s*0px 0px 1\.5em 0px;\s*padding:\s*0px;\s*background-color:\s*transparent;">/gi;
const roTitleCleanRegex = /<div class="x-section ro-title-section"\s+style="margin:\s*0px;\s*padding:\s*0px;\s*background-color:\s*transparent;">/gi;
const roOverviewCleanRegex = /<div class="x-section ro-overview-section"\s+style="margin:\s*0px 0px 1\.5em 0px;\s*padding:\s*0px;\s*background-color:\s*transparent;">/gi;
const textJustifyRegex = /<p\s+style="text-align:\s*justify;">/gi;

// Legend text clean
const legendOngoingTextRegex = /<p style="text-align:\s*center;\s*margin:\s*0;\s*font-size:\s*14px;"><strong>Bộ truyện dài kỳ<\/strong><\/p>/gi;
const legendMiniTextRegex = /<p style="text-align:\s*center;\s*margin:\s*0;\s*font-size:\s*14px;">(<span class="ro-item-mini"><strong>Bộ truyện ngắn kỳ<\/strong><\/span>)<\/p>/gi;
const legendOneshotTextRegex = /<p style="text-align:\s*center;\s*margin:\s*0;\s*font-size:\s*14px;">(<span class="ro-item-oneshot"><strong>Tập đơn \(One-Shot\)<\/strong><\/span>)<\/p>/gi;
const legendNoteTextRegex = /<p style="text-align:\s*center;\s*margin:\s*0;\s*font-size:\s*14px;">(<span class="ro-item-phase"><strong>Ghi chú đọc<\/strong><\/span>)<\/p>/gi;

let totalFilesScanned = 0;
let modifiedFilesCount = 0;
let stats = {
  miniReplaced: 0,
  oneshotReplaced: 0,
  phaseReplaced: 0,
  noteReplaced: 0,
  tabContentReplaced: 0,
  emptyTpbReplaced: 0,
  counterCleanReplaced: 0,
  roSectionCleanReplaced: 0,
  legendSectionReplaced: 0,
  legendTextReplaced: 0,
  titleSectionReplaced: 0,
  overviewSectionReplaced: 0,
  textJustifyReplaced: 0
};

function processHtmlFile(filePath) {
  totalFilesScanned++;
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  let fileChanged = false;

  // 1. Refactor Mini Series Span
  if (miniSpanRegex.test(content)) {
    const matches = (content.match(miniSpanRegex) || []).length;
    stats.miniReplaced += matches;
    content = content.replace(miniSpanRegex, '<span class="ro-item-mini">');
    fileChanged = true;
  }

  // 2. Refactor One-shot Span
  if (oneshotSpanRegex.test(content)) {
    const matches = (content.match(oneshotSpanRegex) || []).length;
    stats.oneshotReplaced += matches;
    content = content.replace(oneshotSpanRegex, '<span class="ro-item-oneshot">');
    fileChanged = true;
  }

  // 3. Refactor Phase Span
  if (phaseSpanRegex.test(content)) {
    const matches = (content.match(phaseSpanRegex) || []).length;
    stats.phaseReplaced += matches;
    content = content.replace(phaseSpanRegex, '<span class="ro-item-phase">');
    fileChanged = true;
  }

  // 4. Refactor Note Span
  if (noteSpanRegex.test(content)) {
    const matches = (content.match(noteSpanRegex) || []).length;
    stats.noteReplaced += matches;
    content = content.replace(noteSpanRegex, '<span class="ro-item-note">');
    fileChanged = true;
  }

  // 5. Refactor Tab Content Padding
  if (tabContentRegex.test(content)) {
    const matches = (content.match(tabContentRegex) || []).length;
    stats.tabContentReplaced += matches;
    content = content.replace(tabContentRegex, '<div class="x-text x-content ro-tab-content">');
    fileChanged = true;
  }

  // 6. Refactor Empty TPB
  if (emptyTpbRegex.test(content)) {
    const matches = (content.match(emptyTpbRegex) || []).length;
    stats.emptyTpbReplaced += matches;
    content = content.replace(emptyTpbRegex, '<p class="ro-tab-empty">Chưa có tuyển tập (TPBs).</p>');
    fileChanged = true;
  }

  // 7. Refactor Counter Clean
  if (counterCleanRegex.test(content)) {
    const matches = (content.match(counterCleanRegex) || []).length;
    stats.counterCleanReplaced += matches;
    content = content.replace(counterCleanRegex, '<div class="x-section ro-counter-section ro-counter-clean mbm">');
    fileChanged = true;
  }

  // 8. Refactor Reading Order Section Clean
  if (roSectionCleanRegex.test(content)) {
    const matches = (content.match(roSectionCleanRegex) || []).length;
    stats.roSectionCleanReplaced += matches;
    content = content.replace(roSectionCleanRegex, '<div class="x-section ro-reading-order-section ro-section-clean">');
    fileChanged = true;
  }

  // 9. Refactor Shared Legend Section Clean
  if (roSharedLegendCleanRegex.test(content)) {
    const matches = (content.match(roSharedLegendCleanRegex) || []).length;
    stats.legendSectionReplaced += matches;
    content = content.replace(roSharedLegendCleanRegex, '<div class="x-section ro-shared-legend ro-legend-clean mbm">');
    fileChanged = true;
  }

  // 10. Refactor Legend Text Inline Styles
  if (legendOngoingTextRegex.test(content)) {
    content = content.replace(legendOngoingTextRegex, '<p class="ro-legend-text"><strong>Bộ truyện dài kỳ</strong></p>');
    stats.legendTextReplaced++;
    fileChanged = true;
  }
  if (legendMiniTextRegex.test(content)) {
    content = content.replace(legendMiniTextRegex, '<p class="ro-legend-text">$1</p>');
    stats.legendTextReplaced++;
    fileChanged = true;
  }
  if (legendOneshotTextRegex.test(content)) {
    content = content.replace(legendOneshotTextRegex, '<p class="ro-legend-text">$1</p>');
    stats.legendTextReplaced++;
    fileChanged = true;
  }
  if (legendNoteTextRegex.test(content)) {
    content = content.replace(legendNoteTextRegex, '<p class="ro-legend-text">$1</p>');
    stats.legendTextReplaced++;
    fileChanged = true;
  }

  // 11. Refactor Title Section
  if (roTitleCleanRegex.test(content)) {
    const matches = (content.match(roTitleCleanRegex) || []).length;
    stats.titleSectionReplaced += matches;
    content = content.replace(roTitleCleanRegex, '<div class="x-section ro-title-section ro-section-clean">');
    fileChanged = true;
  }

  // 12. Refactor Overview Section
  if (roOverviewCleanRegex.test(content)) {
    const matches = (content.match(roOverviewCleanRegex) || []).length;
    stats.overviewSectionReplaced += matches;
    content = content.replace(roOverviewCleanRegex, '<div class="x-section ro-overview-section ro-overview-clean">');
    fileChanged = true;
  }

  // 13. Refactor Text Justify
  if (textJustifyRegex.test(content)) {
    const matches = (content.match(textJustifyRegex) || []).length;
    stats.textJustifyReplaced += matches;
    content = content.replace(textJustifyRegex, '<p class="ro-text-justify">');
    fileChanged = true;
  }

  if (fileChanged && content !== originalContent) {
    modifiedFilesCount++;
    if (!isDryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

function traverseDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      traverseDirectory(fullPath);
    } else if (entry.isFile() && entry.name.toLowerCase() === 'index.html') {
      processHtmlFile(fullPath);
    }
  }
}

console.log(`🚀 Bắt đầu quá trình chuẩn hoá CSS & loại bỏ inline styles...`);
console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (Không ghi đè)' : '✍️ GHI ĐÈ FILE'}`);

const startTime = Date.now();

if (singleFilePath) {
  const absPath = path.isAbsolute(singleFilePath) ? singleFilePath : path.resolve(rootDir, singleFilePath);
  if (fs.existsSync(absPath)) {
    console.log(`📄 Xử lý file đơn lẻ: ${absPath}`);
    processHtmlFile(absPath);
  } else {
    console.error(`❌ Không tìm thấy file: ${absPath}`);
    process.exit(1);
  }
} else {
  for (const folder of scanDirs) {
    const targetDir = path.join(rootDir, folder);
    if (fs.existsSync(targetDir)) {
      console.log(`📁 Quét thư mục: ${folder}/`);
      traverseDirectory(targetDir);
    }
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n================ KẾT QUẢ ================`);
console.log(`⏱️ Thời gian thực hiện: ${duration}s`);
console.log(`📊 Tổng số file quét: ${totalFilesScanned}`);
console.log(`✨ Số file có thay đổi: ${modifiedFilesCount}`);
console.log(`🔹 Miniseries (ro-item-mini): ${stats.miniReplaced}`);
console.log(`🔹 One-shot (ro-item-oneshot): ${stats.oneshotReplaced}`);
console.log(`🔹 Giai đoạn (ro-item-phase): ${stats.phaseReplaced}`);
console.log(`🔹 Ghi chú (ro-item-note): ${stats.noteReplaced}`);
console.log(`🔹 Tab Padding (ro-tab-content): ${stats.tabContentReplaced}`);
console.log(`🔹 TPB Empty (ro-tab-empty): ${stats.emptyTpbReplaced}`);
console.log(`🔹 Counter Clean: ${stats.counterCleanReplaced}`);
console.log(`🔹 Section Clean: ${stats.roSectionCleanReplaced}`);
console.log(`🔹 Legend Section Clean: ${stats.legendSectionReplaced}`);
console.log(`🔹 Legend Text Clean: ${stats.legendTextReplaced}`);
console.log(`🔹 Title Section Clean: ${stats.titleSectionReplaced}`);
console.log(`🔹 Overview Section Clean: ${stats.overviewSectionReplaced}`);
console.log(`🔹 Text Justify Clean: ${stats.textJustifyReplaced}`);
console.log(`=========================================`);
