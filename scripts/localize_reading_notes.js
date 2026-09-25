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

let totalFilesScanned = 0;
let modifiedFilesCount = 0;
let stats = {
  readEventNotes: 0,
  alternateUniverse: 0,
  alternateStart: 0,
  formatNotes: 0,
  bioLabels: 0,
  tpbTabs: 0,
  counters: 0,
  partLinks: 0
};

function localizeContent(content) {
  let changed = false;

  // 1. Ghi chú điều hướng sự kiện: "Read ... here."
  // Khớp thẻ có link: Read <a href="...">...</a> here.
  const readLinkRegex = /(<span[^>]*class="[^"]*ro-item-note[^"]*"[^>]*>[\s\S]*?)Read\s+(<a[^>]*>[\s\S]*?<\/a>)\s+here\.?([\s\S]*?<\/span>)/gi;
  if (readLinkRegex.test(content)) {
    const matches = (content.match(readLinkRegex) || []).length;
    stats.readEventNotes += matches;
    content = content.replace(readLinkRegex, '$1Đọc sự kiện $2 tại đây.$3');
    changed = true;
  }

  // Khớp không có thẻ link: Read ... here. (trong ro-item-note)
  const readPlainRegex = /(<span[^>]*class="[^"]*ro-item-note[^"]*"[^>]*>\s*(?:<strong>|<em>)?)Read\s+([^<]+?)\s+here\.?((?:<\/strong>|<\/em>)?\s*<\/span>)/gi;
  if (readPlainRegex.test(content)) {
    const matches = (content.match(readPlainRegex) || []).length;
    stats.readEventNotes += matches;
    content = content.replace(readPlainRegex, '$1Đọc sự kiện $2 tại đây.$3');
    changed = true;
  }

  // Khớp trường hợp còn inline style (nếu có sót):
  const readInlineRegex = /(<span[^>]*style="[^"]*color:\s*(?:#0000ff|blue)[^"]*"[^>]*>[\s\S]*?)Read\s+(<a[^>]*>[\s\S]*?<\/a>|[^<]+?)\s+here\.?([\s\S]*?<\/span>)/gi;
  if (readInlineRegex.test(content)) {
    const matches = (content.match(readInlineRegex) || []).length;
    stats.readEventNotes += matches;
    content = content.replace(readInlineRegex, '$1Đọc sự kiện $2 tại đây.$3');
    changed = true;
  }

  // 2. Alternate Universe -> Vũ trụ song song
  const altUniRegex = /(<span[^>]*class="[^"]*ro-item-note[^"]*"[^>]*>[\s\S]*?)Alternate Universe([\s\S]*?<\/span>)/gi;
  if (altUniRegex.test(content)) {
    const matches = (content.match(altUniRegex) || []).length;
    stats.alternateUniverse += matches;
    content = content.replace(altUniRegex, '$1Vũ trụ song song$2');
    changed = true;
  }

  // 3. Alternate Starting Point -> Điểm bắt đầu thay thế:
  const altStartRegex = /Alternate\s+[Ss]tarting\s+[Pp]oint:/g;
  if (altStartRegex.test(content)) {
    const matches = (content.match(altStartRegex) || []).length;
    stats.alternateStart += matches;
    content = content.replace(altStartRegex, 'Điểm bắt đầu thay thế:');
    changed = true;
  }

  // 4. Định dạng phát hành
  const digitalFirstRegex = /(<span[^>]*class="[^"]*ro-item-note[^"]*"[^>]*>[\s\S]*?)Digital First([\s\S]*?<\/span>)/gi;
  if (digitalFirstRegex.test(content)) {
    const matches = (content.match(digitalFirstRegex) || []).length;
    stats.formatNotes += matches;
    content = content.replace(digitalFirstRegex, '$1Phát hành kỹ thuật số trước$2');
    changed = true;
  }

  const marvelDigitalRegex = /(<span[^>]*class="[^"]*ro-item-note[^"]*"[^>]*>[\s\S]*?)Marvel Digital Original([\s\S]*?<\/span>)/gi;
  if (marvelDigitalRegex.test(content)) {
    const matches = (content.match(marvelDigitalRegex) || []).length;
    stats.formatNotes += matches;
    content = content.replace(marvelDigitalRegex, '$1Bản kỹ thuật số độc quyền Marvel$2');
    changed = true;
  }

  const backupRegex = /(<span[^>]*class="[^"]*ro-item-note[^"]*"[^>]*>[\s\S]*?)Backup\s+stor(?:y|ies)([\s\S]*?<\/span>)/gi;
  if (backupRegex.test(content)) {
    const matches = (content.match(backupRegex) || []).length;
    stats.formatNotes += matches;
    content = content.replace(backupRegex, '$1Truyện phụ$2');
    changed = true;
  }

  // 5. Thông số tiểu sử nhân vật (Bio labels)
  const firstAppRegex = /<strong>First\s+Appearance<\/strong>:/gi;
  if (firstAppRegex.test(content)) {
    const matches = (content.match(firstAppRegex) || []).length;
    stats.bioLabels += matches;
    content = content.replace(firstAppRegex, '<strong>Xuất hiện lần đầu</strong>:');
    changed = true;
  }
  const firstAppColonRegex = /<strong>First\s+Appearance:<\/strong>/gi;
  if (firstAppColonRegex.test(content)) {
    const matches = (content.match(firstAppColonRegex) || []).length;
    stats.bioLabels += matches;
    content = content.replace(firstAppColonRegex, '<strong>Xuất hiện lần đầu:</strong>');
    changed = true;
  }

  const creatorsRegex = /<strong>Creators<\/strong>:/gi;
  if (creatorsRegex.test(content)) {
    const matches = (content.match(creatorsRegex) || []).length;
    stats.bioLabels += matches;
    content = content.replace(creatorsRegex, '<strong>Tác giả sáng tạo</strong>:');
    changed = true;
  }
  const creatorsColonRegex = /<strong>Creators:<\/strong>/gi;
  if (creatorsColonRegex.test(content)) {
    const matches = (content.match(creatorsColonRegex) || []).length;
    stats.bioLabels += matches;
    content = content.replace(creatorsColonRegex, '<strong>Tác giả sáng tạo:</strong>');
    changed = true;
  }

  const powersRegex = /<strong>Powers<\/strong>:/gi;
  if (powersRegex.test(content)) {
    const matches = (content.match(powersRegex) || []).length;
    stats.bioLabels += matches;
    content = content.replace(powersRegex, '<strong>Năng lực & Sức mạnh</strong>:');
    changed = true;
  }
  const powersColonRegex = /<strong>Powers:<\/strong>/gi;
  if (powersColonRegex.test(content)) {
    const matches = (content.match(powersColonRegex) || []).length;
    stats.bioLabels += matches;
    content = content.replace(powersColonRegex, '<strong>Năng lực & Sức mạnh:</strong>');
    changed = true;
  }

  // 6. Tab Tuyển tập: <span>TPBs</span> -> <span>Tuyển tập (TPBs)</span>
  const tpbTabRegex = /<button([^>]*data-x-toggle="tab"[^>]*)>\s*<span>TPBs<\/span>\s*<\/button>/gi;
  if (tpbTabRegex.test(content)) {
    const matches = (content.match(tpbTabRegex) || []).length;
    stats.tpbTabs += matches;
    content = content.replace(tpbTabRegex, '<button$1><span>Tuyển tập (TPBs)</span></button>');
    changed = true;
  }

  // 7. Bộ đếm (Counter): ISSUES / NOT INCLUDING EVENTS
  const counterBeforeIssuesRegex = /<div class="x-counter-before">ISSUES<\/div>/gi;
  if (counterBeforeIssuesRegex.test(content)) {
    const matches = (content.match(counterBeforeIssuesRegex) || []).length;
    stats.counters += matches;
    content = content.replace(counterBeforeIssuesRegex, '<div class="x-counter-before">TẬP TRUYỆN</div>');
    changed = true;
  }

  const counterAfterNotIncRegex = /<div class="x-counter-after">NOT INCLUDING EVENTS<\/div>/gi;
  if (counterAfterNotIncRegex.test(content)) {
    const matches = (content.match(counterAfterNotIncRegex) || []).length;
    stats.counters += matches;
    content = content.replace(counterAfterNotIncRegex, '<div class="x-counter-after">KHÔNG BAO GỒM CÁC SỰ KIỆN PHỤ</div>');
    changed = true;
  }

  // 8. Part Links: >Part 1<, >Part 2<...
  const partLinkTagRegex = />Part\s+(\d+)</gi;
  if (partLinkTagRegex.test(content)) {
    const matches = (content.match(partLinkTagRegex) || []).length;
    stats.partLinks += matches;
    content = content.replace(partLinkTagRegex, '>Phần $1<');
    changed = true;
  }

  const partLinkCloseRegex = /Part\s+(\d+)<\/a>/gi;
  if (partLinkCloseRegex.test(content)) {
    const matches = (content.match(partLinkCloseRegex) || []).length;
    stats.partLinks += matches;
    content = content.replace(partLinkCloseRegex, 'Phần $1</a>');
    changed = true;
  }

  const partTextRegex = /(All-New,\s+All-Different\s+Marvel)\s+Part\s+(\d+)/gi;
  if (partTextRegex.test(content)) {
    const matches = (content.match(partTextRegex) || []).length;
    stats.partLinks += matches;
    content = content.replace(partTextRegex, '$1 Phần $2');
    changed = true;
  }

  // 9. Legend English: Ongoing Series -> Bộ truyện dài kỳ
  const ongoingSeriesRegex = />\s*Ongoing Series\s*</gi;
  if (ongoingSeriesRegex.test(content)) {
    content = content.replace(ongoingSeriesRegex, '>Bộ truyện dài kỳ<');
    changed = true;
  }
  const commentsLegendRegex = />\s*Comments\s*</gi;
  if (commentsLegendRegex.test(content)) {
    content = content.replace(commentsLegendRegex, '>Ghi chú đọc<');
    changed = true;
  }

  return { content, changed };
}

function processHtmlFile(filePath) {
  totalFilesScanned++;
  const originalContent = fs.readFileSync(filePath, 'utf8');
  const { content, changed } = localizeContent(originalContent);

  if (changed && content !== originalContent) {
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

console.log(`🚀 Bắt đầu quá trình Việt hoá Ghi Chú Đọc & Nhãn Tiếng Anh...`);
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
console.log(`\n================ KẾT QUẢ VIỆT HOÁ ================`);
console.log(`⏱️ Thời gian thực hiện: ${duration}s`);
console.log(`📊 Tổng số file quét: ${totalFilesScanned}`);
console.log(`✨ Số file có thay đổi: ${modifiedFilesCount}`);
console.log(`🔹 Ghi chú sự kiện (Read [Event] here): ${stats.readEventNotes}`);
console.log(`🔹 Ghi chú Vũ trụ song song: ${stats.alternateUniverse}`);
console.log(`🔹 Điểm bắt đầu thay thế: ${stats.alternateStart}`);
console.log(`🔹 Định dạng phát hành (Digital First, Backup...): ${stats.formatNotes}`);
console.log(`🔹 Nhãn tiểu sử (First Appearance/Creators/Powers): ${stats.bioLabels}`);
console.log(`🔹 Tab Tuyển tập (TPBs): ${stats.tpbTabs}`);
console.log(`🔹 Bộ đếm (ISSUES / NOT INCLUDING EVENTS): ${stats.counters}`);
console.log(`🔹 Liên kết phân đoạn (Part 1, 2...): ${stats.partLinks}`);
console.log(`===================================================`);
