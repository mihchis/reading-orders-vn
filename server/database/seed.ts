import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { db, initDatabase } from './db';

export function runSeed() {
  initDatabase();
  console.log('--- Bắt đầu nạp dữ liệu mẫu (Seeding) ---');

  // 1. Tạo tài khoản Admin mặc định nếu chưa có
  const checkAdmin = db.prepare('SELECT id FROM admins WHERE username = ?');
  const existingAdmin = checkAdmin.get('admin');
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    const insertAdmin = db.prepare('INSERT INTO admins (username, password_hash, display_name) VALUES (?, ?, ?)');
    insertAdmin.run('admin', hash, 'Quản Trị Viên');
    console.log('-> Đã tạo tài khoản admin: admin / admin123');
  }

  // 2. Tạo các Vũ trụ (Universes)
  const universesData = [
    { slug: 'marvel', name: 'Marvel', accent_color: '#e42525', description: 'Vũ trụ Marvel Comics với hàng ngàn siêu anh hùng và sự kiện sử thi.', sort_order: 1 },
    { slug: 'dc', name: 'DC', accent_color: '#0066aa', description: 'Vũ trụ DC Comics với Superman, Batman, Wonder Woman và các đại sự kiện Đa Vũ Trụ.', sort_order: 2 },
    { slug: 'other', name: 'Khác (Other)', accent_color: '#333333', description: 'Các bộ truyện độc lập và nhà xuất bản khác như Image, Dark Horse, IDW: The Boys, Hellboy, Invincible, TMNT...', sort_order: 3 },
  ];

  const insertUniv = db.prepare(`
    INSERT OR IGNORE INTO universes (slug, name, accent_color, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const u of universesData) {
    insertUniv.run(u.slug, u.name, u.accent_color, u.description, u.sort_order);
  }

  const getUnivId = db.prepare('SELECT id FROM universes WHERE slug = ?');
  const marvelId = (getUnivId.get('marvel') as any).id;
  const dcId = (getUnivId.get('dc') as any).id;
  const otherId = (getUnivId.get('other') as any).id;

  // 3. Tạo các Danh mục (Categories)
  const categoriesData = [
    { universe_id: marvelId, slug: 'events', name: 'Sự Kiện Marvel', description: 'Tất cả các sự kiện lớn của Marvel Comics theo thứ tự thời gian.', sort_order: 1 },
    { universe_id: marvelId, slug: 'characters', name: 'Nhân Vật Marvel', description: 'Thứ tự đọc theo từng nhân vật Marvel nổi tiếng.', sort_order: 2 },
    { universe_id: marvelId, slug: 'master', name: 'Thứ Tự Đọc Marvel Master', description: 'Thứ tự đọc toàn diện nhất bao quát toàn bộ vũ trụ Marvel.', sort_order: 3 },

    { universe_id: dcId, slug: 'events', name: 'Sự Kiện DC', description: 'Các sự kiện Crisis và đại sự kiện thay đổi đa vũ trụ DC.', sort_order: 1 },
    { universe_id: dcId, slug: 'characters', name: 'Nhân Vật DC', description: 'Thứ tự đọc từng thành viên Justice League và phản diện.', sort_order: 2 },
    { universe_id: dcId, slug: 'master', name: 'Thứ Tự Đọc DC Master', description: 'Thứ tự đọc tổng thể vũ trụ DC qua các kỷ nguyên.', sort_order: 3 },

    { universe_id: otherId, slug: 'series', name: 'Series Độc Lập', description: 'Các vũ trụ và series truyện tranh ngoài Marvel/DC.', sort_order: 1 },
  ];

  const insertCat = db.prepare(`
    INSERT OR IGNORE INTO categories (universe_id, slug, name, description, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const c of categoriesData) {
    insertCat.run(c.universe_id, c.slug, c.name, c.description, c.sort_order);
  }

  // 4. Trích xuất dữ liệu từ các file HTML trong tham_khao
  const thamKhaoDir = path.resolve(process.cwd(), 'tham_khao');

  interface ReadingOrderSeed {
    fileName: string;
    slug: string;
    title: string;
    universe_id: number;
    category_slug: string;
    descriptionFallback: string;
    yearFallback: string;
    charactersFallback: string;
    prevFallback?: string;
    nextFallback?: string;
  }

  const seedFiles: ReadingOrderSeed[] = [
    {
      fileName: 'House of M Reading Order (9_17_2026 9：43：07 AM).html',
      slug: 'house-of-m',
      title: 'House of M',
      universe_id: marvelId,
      category_slug: 'events',
      descriptionFallback: 'Scarlet Witch dùng năng lực của mình tạo ra một thế giới mới nơi người đột biến (mutant) nắm quyền kiểm soát toàn cầu, con người bình thường bị coi là hạ đẳng.',
      yearFallback: '2005',
      charactersFallback: 'X-Men, Scarlet Witch, Avengers, Magneto',
      prevFallback: 'Avengers Disassembled',
      nextFallback: 'Decimation',
    },
    {
      fileName: 'Secret Wars (2015) Reading Order (9_17_2026 9：42：20 AM).html',
      slug: 'secret-wars-2015',
      title: 'Secret Wars (2015)',
      universe_id: marvelId,
      category_slug: 'events',
      descriptionFallback: 'Đa vũ trụ sụp đổ do hiện tượng va chạm Incursions. Doctor Doom thu thập các mảnh vỡ của các thực tại và tạo nên thế giới chắp vá Battleworld dưới sự cai trị độc tôn.',
      yearFallback: '2015',
      charactersFallback: 'Doctor Doom, Reed Richards, Thanos, Avengers, Thors',
      prevFallback: 'Time Runs Out',
      nextFallback: 'All-New, All-Different Marvel',
    },
    {
      fileName: 'Planet Hulk Reading Order (9_17_2026 9：42：45 AM).html',
      slug: 'planet-hulk',
      title: 'Planet Hulk',
      universe_id: marvelId,
      category_slug: 'events',
      descriptionFallback: 'Sau khi bị nhóm Illuminati trục xuất khỏi Trái Đất, phi thuyền của Hulk rơi xuống hành tinh man rợ Sakaar, nơi anh trở thành võ sĩ giác đấu và lãnh đạo cuộc cách mạng giải phóng.',
      yearFallback: '2006',
      charactersFallback: 'Hulk, Warbound, Red King, Caiera',
      prevFallback: 'Prelude to Planet Hulk',
      nextFallback: 'World War Hulk',
    },
    {
      fileName: 'Avengers Disassembled Reading Order (9_17_2026 9：43：18 AM).html',
      slug: 'avengers-disassembled',
      title: 'Avengers Disassembled',
      universe_id: marvelId,
      category_slug: 'events',
      descriptionFallback: 'Ngày tồi tệ nhất trong lịch sử Avengers khi những biến cố liên tiếp ập đến từ chính một thành viên trong nội bộ, dẫn đến sự tan rã đau đớn của nhóm siêu anh hùng vĩ đại nhất Trái Đất.',
      yearFallback: '2004',
      charactersFallback: 'Avengers, Scarlet Witch, Iron Man, Captain America',
      prevFallback: 'Chaos',
      nextFallback: 'House of M',
    },
    {
      fileName: 'Crisis on Infinite Earths Reading Order (9_17_2026 9：46：02 AM).html',
      slug: 'crisis-on-infinite-earths',
      title: 'Crisis on Infinite Earths',
      universe_id: dcId,
      category_slug: 'events',
      descriptionFallback: 'Đại sự kiện vĩ đại nhất lịch sử DC Comics: Thực thể Anti-Monitor quét sạch vô số vũ trụ song song bằng làn sóng phản vật chất, buộc toàn bộ anh hùng và phản diện của đa vũ trụ phải đoàn kết sinh tồn.',
      yearFallback: '1985-1986',
      charactersFallback: 'Monitor, Anti-Monitor, Supergirl, Flash (Barry Allen), Justice League',
      prevFallback: '',
      nextFallback: 'Post-Crisis DC Universe',
    },
    {
      fileName: 'Aquaman： Death of a Prince Reading Order (9_17_2026 9：46：17 AM).html',
      slug: 'aquaman-death-of-a-prince',
      title: 'Aquaman: Death of a Prince',
      universe_id: dcId,
      category_slug: 'events',
      descriptionFallback: 'Bi kịch giáng xuống Atlantis và Aquaman khi kẻ thù Black Manta thực hiện âm mưu tàn khốc cướp đi đứa con trai yêu dấu của anh, biến đây thành câu chuyện kinh điển sâu sắc.',
      yearFallback: '1974-1978',
      charactersFallback: 'Aquaman, Mera, Black Manta, Ocean Master',
      prevFallback: '',
      nextFallback: '',
    },
    {
      fileName: 'The Boys Reading Order (9_17_2026 9：48：06 AM).html',
      slug: 'the-boys',
      title: 'The Boys',
      universe_id: otherId,
      category_slug: 'series',
      descriptionFallback: 'Trong một thế giới nơi các siêu anh hùng bị tha hóa bởi danh vọng và quyền lực của tập đoàn Vought, một nhóm mật vụ đen mang tên The Boys được lập ra để trừng phạt những kẻ vượt qua giới hạn.',
      yearFallback: '2006-2012',
      charactersFallback: 'Billy Butcher, Hughie, Homelander, The Seven, Starlight',
      prevFallback: '',
      nextFallback: 'The Boys: Dear Becky',
    },
    {
      fileName: 'Hellboy (Mignolaverse) Reading Order (9_17_2026 9：47：11 AM).html',
      slug: 'hellboy-mignolaverse',
      title: 'Hellboy (Mignolaverse)',
      universe_id: otherId,
      category_slug: 'series',
      descriptionFallback: 'Theo chân Hellboy và cơ quan B.P.R.D. điều tra các hiện tượng siêu nhiên, bí ẩn cổ xưa, thần thoại dân gian và các thế lực tà ác huyền bí đậm chất gothic của Mike Mignola.',
      yearFallback: '1994-nay',
      charactersFallback: 'Hellboy, Abe Sapien, Liz Sherman, B.P.R.D.',
      prevFallback: '',
      nextFallback: '',
    },
    {
      fileName: 'Invincible Reading Order (9_17_2026 9：46：56 AM).html',
      slug: 'invincible',
      title: 'Invincible',
      universe_id: otherId,
      category_slug: 'series',
      descriptionFallback: 'Mark Grayson, con trai của siêu anh hùng mạnh nhất Trái Đất Omni-Man, bắt đầu phát triển siêu năng lực và khám phá ra những bí mật chấn động về nguồn gốc chủng tộc Viltrumite.',
      yearFallback: '2003-2018',
      charactersFallback: 'Mark Grayson (Invincible), Omni-Man, Atom Eve, Allen the Alien',
      prevFallback: '',
      nextFallback: '',
    },
    {
      fileName: 'Marvel 2099 Reading Order (9_17_2026 9：39：07 AM).html',
      slug: 'marvel-2099',
      title: 'Marvel 2099',
      universe_id: marvelId,
      category_slug: 'events',
      descriptionFallback: 'Thế giới tương lai cyberpunk năm 2099 bị thống trị bởi tập đoàn khổng lồ Alchemax, nơi các siêu anh hùng thế hệ mới như Spider-Man 2099 Miguel O\'Hara đứng lên chiến đấu.',
      yearFallback: '1992-1998',
      charactersFallback: 'Spider-Man 2099 (Miguel O\'Hara), Doom 2099, X-Men 2099, Punisher 2099',
      prevFallback: '',
      nextFallback: '2099: Manifest Destiny',
    },
  ];

  // Helper bóc tách HTML
  for (const item of seedFiles) {
    const filePath = path.join(thamKhaoDir, item.fileName);
    let description = item.descriptionFallback;
    let year = item.yearFallback;
    let characters = item.charactersFallback;
    let prevTitle = item.prevFallback || '';
    let nextTitle = item.nextFallback || '';
    const parsedIssues: { title: string; issue_type: string; year?: string; note?: string; read_url?: string }[] = [];

    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const bodyIndex = content.indexOf('<body');
        const searchScope = bodyIndex !== -1 ? content.substring(bodyIndex) : content;

        // Tìm phần meta: Year Published
        const yearMatch = searchScope.match(/<strong>Year Published<\/strong>:\s*&nbsp;\s*([^<]+)/i);
        if (yearMatch && yearMatch[1].trim()) {
          year = yearMatch[1].trim();
        }

        // Tìm Featured Characters
        const charMatch = searchScope.match(/<strong>Featured Characters<\/strong>:\s*&nbsp;\s*([^<]+)/i);
        if (charMatch && charMatch[1].trim()) {
          characters = charMatch[1].replace(/&nbsp;/g, ' ').trim();
        }

        // Tìm Previous / Next Event
        const prevMatch = searchScope.match(/<strong>Previous Event<\/strong>:\s*&nbsp;\s*<a[^>]*>([^<]+)<\/a>/i);
        if (prevMatch && prevMatch[1].trim()) {
          prevTitle = prevMatch[1].trim();
        }
        const nextMatch = searchScope.match(/<strong>Next Event<\/strong>:\s*&nbsp;\s*<a[^>]*>([^<]+)<\/a>/i);
        if (nextMatch && nextMatch[1].trim()) {
          nextTitle = nextMatch[1].trim();
        }

        // Tìm phần danh sách tập truyện (tabs panel)
        const panelStart = searchScope.indexOf('x-tabs-panels');
        if (panelStart !== -1) {
          const snippet = searchScope.substring(panelStart, panelStart + 120000);
          const lines = snippet.split(/<br\s*\/?>|<\/p>|<p[^>]*>/gi);

          for (let rawLine of lines) {
            let clean = rawLine.trim();
            if (!clean || clean.includes('x-tabs') || clean.includes('Single Issues') || clean.includes('TPBs')) continue;
            // Bỏ các thẻ div, span thừa
            if (clean.startsWith('</div>') || clean.startsWith('role=') || clean.startsWith('data-x-toggle')) continue;
            if (clean.includes('entry-footer') || clean.includes('x-colophon') || clean.includes('wp-admin') || clean.includes('Amazon Services')) break;

            // Kiểm tra màu sắc xác định loại tập
            let issueType = 'ongoing';
            if (clean.includes('color:#008000') || clean.includes('color: #008000')) {
              issueType = 'limited';
            } else if (clean.includes('color:#ff0000') || clean.includes('color: #ff0000')) {
              issueType = 'oneshot';
            } else if (clean.includes('color:#0000ff') || clean.includes('color: #0000ff')) {
              issueType = 'comment';
            }

            // Trích xuất năm trong ngoặc (ví dụ: (2005))
            let issueYear = '';
            const issueYearMatch = clean.match(/\((\d{4})\)/);
            if (issueYearMatch) {
              issueYear = issueYearMatch[1];
            }

            // Lọc sạch text
            let titleText = clean
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&nbsp;/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            // Bỏ số năm cuối nếu có (đã lưu ở issueYear)
            titleText = titleText.replace(/\(\d{4}\)$/, '').trim();

            // Bỏ qua disclaimer hoặc quảng cáo
            if (titleText.includes('Amazon Services') || titleText.includes('affiliate advertising')) continue;

            // Việt hóa các comment phổ biến
            if (issueType === 'comment') {
              if (titleText.includes('original 1992 event') && titleText.includes('2099')) {
                titleText = 'Đây là thứ tự đọc cho sự kiện gốc năm 1992, sự kiện năm 2019 có thể xem tại [2099](/reading-order/2099).';
              } else if (titleText.includes('2019 event') && titleText.includes('Marvel 2099')) {
                titleText = 'Đây là thứ tự đọc cho sự kiện năm 2019, sự kiện gốc năm 1992 có thể xem tại [Marvel 2099](/reading-order/marvel-2099).';
              } else if (titleText.includes('Marvel Zombies Reading Order')) {
                titleText = 'Bạn có thể đọc [Thứ Tự Đọc Marvel Zombies](/reading-order/marvel-zombies) tại đây. Ultimate Fantastic Four #21-23 chính là điểm khởi nguồn của vũ trụ Marvel Zombies.';
              }
            }

            if (titleText.length > 2 && !titleText.startsWith('http') && !titleText.startsWith('@') && !titleText.includes('Copyright') && !titleText.startsWith('<') && !titleText.startsWith('Skip to')) {
              parsedIssues.push({
                title: titleText,
                issue_type: issueType,
                year: issueYear || undefined,
                read_url: undefined
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Không thể đọc chi tiết file ${item.fileName}:`, err);
      }
    }

    // Nếu không bóc tách được issue nào thì tạo danh sách issue mặc định
    if (parsedIssues.length === 0) {
      parsedIssues.push(
        { title: `${item.title} #1`, issue_type: 'limited', year: year, read_url: 'https://readcomiconline.li' },
        { title: `${item.title} #2`, issue_type: 'limited', year: year, read_url: 'https://readcomiconline.li' },
        { title: `${item.title} #3`, issue_type: 'limited', year: year },
        { title: `${item.title} #4`, issue_type: 'limited', year: year },
        { title: `${item.title} Ghi chú: Đọc các tie-in liên quan`, issue_type: 'comment' },
        { title: `${item.title} #5 (Kết thúc)`, issue_type: 'limited', year: year }
      );
    }

    // Cài đặt mẫu một số link đọc truyện sẵn cho 2-3 tập đầu tiên để người dùng có thể bấm thử ngay!
    parsedIssues.forEach((issue, idx) => {
      if (idx === 0) {
        issue.read_url = `https://readcomiconline.li/Comic/${item.slug}/Issue-1`;
      } else if (idx === 1) {
        issue.read_url = `https://readcomiconline.li/Comic/${item.slug}/Issue-2`;
      }
    });

    // Lấy category ID
    const catQuery = db.prepare('SELECT id FROM categories WHERE universe_id = ? AND slug = ?');
    const catRow = catQuery.get(item.universe_id, item.category_slug) as any;
    const categoryId = catRow ? catRow.id : null;

    // Lưu vào database
    const insertOrder = db.prepare(`
      INSERT INTO reading_orders (
        slug, title, universe_id, category_id, description, year_published,
        featured_characters, previous_event_title, previous_event_slug,
        next_event_title, next_event_slug, cover_image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        year_published = excluded.year_published,
        featured_characters = excluded.featured_characters,
        previous_event_title = excluded.previous_event_title,
        next_event_title = excluded.next_event_title
    `);

    insertOrder.run(
      item.slug,
      item.title,
      item.universe_id,
      categoryId,
      description,
      year,
      characters,
      prevTitle,
      prevTitle ? prevTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      nextTitle,
      nextTitle ? nextTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '',
      `https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=600&auto=format&fit=crop&q=80`
    );

    const getOrderId = db.prepare('SELECT id FROM reading_orders WHERE slug = ?');
    const orderRow = getOrderId.get(item.slug) as any;
    const orderId = orderRow.id;

    // Xóa issues cũ nếu có và thêm mới
    db.prepare('DELETE FROM issues WHERE reading_order_id = ?').run(orderId);

    const insertIssue = db.prepare(`
      INSERT INTO issues (reading_order_id, tab_type, title, issue_type, year, note, read_url, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let sortIdx = 1;
    for (const issue of parsedIssues) {
      insertIssue.run(
        orderId,
        'single',
        issue.title,
        issue.issue_type,
        issue.year || null,
        issue.note || null,
        issue.read_url || null,
        sortIdx++
      );
    }

    console.log(`-> Đã nạp thành công [${item.title}] với ${parsedIssues.length} tập truyện.`);
  }

  // 5. Nạp danh sách câu hỏi thường gặp (FAQs) Việt hóa
  const faqs = [
    {
      question: 'Reading Order (Thứ tự đọc truyện tranh) là gì?',
      answer: 'Reading Order là danh sách sắp xếp thứ tự các tập truyện tranh (issues) và các phần ngoại truyện (tie-ins, one-shots, prologue, epilogue) theo trình tự diễn biến mạch truyện hợp lý nhất, giúp người đọc theo dõi trọn vẹn sự kiện mà không bị bỏ sót tình tiết quan trọng.'
    },
    {
      question: 'Làm thế nào để đọc một tập truyện trên trang web này?',
      answer: 'Trong mỗi trang thứ tự đọc, bạn chỉ cần bấm vào tên tập truyện có biểu tượng đọc truyện hoặc nút "Đọc truyện", hệ thống sẽ chuyển bạn trực tiếp đến link đọc truyện đã được Admin thiết lập sẵn.'
    },
    {
      question: 'Ý nghĩa của các màu sắc trong danh sách tập truyện?',
      answer: 'Màu sắc thể hiện định dạng phát hành của tập: Chữ đen là Series Dài Kỳ (Ongoing Series), Chữ xanh lá là Series Giới Hạn (Limited Series/Miniseries), Chữ đỏ là One-Shot (tập đơn), và Chữ xanh dương là Ghi Chú Hướng Dẫn Đọc của chuyên gia.'
    },
    {
      question: 'Tôi có thể lưu lại tiến độ các tập truyện mình đã đọc không?',
      answer: 'Có! Hệ thống cung cấp ô tích chọn "Đã đọc" bên cạnh từng tập truyện. Trình duyệt của bạn sẽ tự động lưu lại danh sách đã tích và hiển thị thanh phần trăm tiến độ hoàn thành sự kiện.'
    },
    {
      question: 'Admin quản lý và cài đặt link đọc truyện như thế nào?',
      answer: 'Admin có thể đăng nhập vào hệ thống quản trị (/admin/login) để thêm, sửa, xóa thứ tự đọc, sắp xếp lại vị trí các tập và điền link đọc truyện (Read URL) cho từng tập bất kỳ lúc nào.'
    }
  ];

  db.exec('DELETE FROM faqs;');
  const insertFaq = db.prepare('INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)');
  faqs.forEach((faq, index) => {
    insertFaq.run(faq.question, faq.answer, index + 1);
  });
  console.log('-> Đã nạp danh sách FAQs Việt hóa.');

  console.log('--- Hoàn tất Seeding thành công! ---');
}

// Chạy trực tiếp nếu script được gọi độc lập
if (require.main === module || process.argv[1]?.includes('seed')) {
  runSeed();
}
