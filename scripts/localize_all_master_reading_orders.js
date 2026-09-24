const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Helper to replace label occurrences
function replaceLabels(content) {
  return content
    .replace(/<strong>Issues:<\/strong>/g, '<strong>Số tập:</strong>')
    .replace(/<strong>Issues: <\/strong>/g, '<strong>Số tập: </strong>')
    .replace(/<strong>Issues:<\/strong> /g, '<strong>Số tập:</strong> ')
    .replace(/<strong>Years:<\/strong>/g, '<strong>Năm phát hành:</strong>')
    .replace(/<strong>Years: <\/strong>/g, '<strong>Năm phát hành: </strong>')
    .replace(/<strong>Years:<\/strong> /g, '<strong>Năm phát hành:</strong> ')
    .replace(/<strong>Events:<\/strong>/g, '<strong>Sự kiện:</strong>')
    .replace(/<strong>Events: <\/strong>/g, '<strong>Sự kiện: </strong>')
    .replace(/<strong>Events:<\/strong> /g, '<strong>Sự kiện:</strong> ')
    .replace(/<strong>First Appearances:<\/strong>/g, '<strong>Xuất hiện lần đầu:</strong>')
    .replace(/<strong>First Appearances: <\/strong>/g, '<strong>Xuất hiện lần đầu: </strong>')
    .replace(/<strong>First Appearances:<\/strong> /g, '<strong>Xuất hiện lần đầu:</strong> ')
    .replace(/<strong>First Appearances:<\/strong>  None/g, '<strong>Xuất hiện lần đầu:</strong>  Không có')
    .replace(/<strong>Xuất hiện lần đầu:<\/strong>  None/g, '<strong>Xuất hiện lần đầu:</strong>  Không có')
    .replace(/<strong>First Appearances: <\/strong> None/g, '<strong>Xuất hiện lần đầu: </strong> Không có')
    .replace(/<strong>Xuất hiện lần đầu: <\/strong> None/g, '<strong>Xuất hiện lần đầu: </strong> Không có')
    .replace(/<strong>Events:<\/strong>  None/g, '<strong>Sự kiện:</strong>  Không có')
    .replace(/<strong>Events: <\/strong> None/g, '<strong>Sự kiện: </strong> Không có')
    .replace(/<strong>Sự kiện:<\/strong>  None/g, '<strong>Sự kiện:</strong>  Không có')
    .replace(/<strong>Sự kiện: <\/strong> None/g, '<strong>Sự kiện: </strong> Không có');
}

// Helper to replace Part navigation links
function replacePartNav(content) {
  for (let i = 15; i >= 1; i--) {
    const regPart = new RegExp(`>Part ${i}<`, 'g');
    content = content.replace(regPart, `>Phần ${i}<`);
  }
  return content;
}

// 1. UPDATE marvel/marvel-master-reading-order/index.html
const marvelMasterFile = path.join(rootDir, 'marvel', 'marvel-master-reading-order', 'index.html');
if (fs.existsSync(marvelMasterFile)) {
  let content = fs.readFileSync(marvelMasterFile, 'utf8');

  content = replaceLabels(content);
  content = replacePartNav(content);

  const marvelPartDesc = [
    {
      en: 'Containing by far the most first appearances of significant characters of any Marvel era.  You will see how the biggest superheroes in the Marvel Universe received their superpowers and witness the foundation that decades of comics will be built on.  Witness the formation of the X-Men,  Fantastic Four,  and Avengers.  Like most Silver Age comics there are numerous guest appearances but few actual crossovers.  The beginning of the reading order features numerous limited series that take place chronologically before,  as well as during,  the earliest published Marvel comics.',
      vi: 'Chứa đựng số lượng nhân vật quan trọng xuất hiện lần đầu nhiều nhất trong toàn bộ lịch sử Marvel. Bạn sẽ theo dõi nguồn gốc sức mạnh của những siêu anh hùng vĩ đại nhất Vũ trụ Marvel và chứng kiến nền móng xây dựng nên nhiều thập kỷ truyện tranh. Chứng kiến sự thành lập của X-Men, Fantastic Four và Avengers. Giống như hầu hết truyện tranh thời kỳ Silver Age, có rất nhiều màn xuất hiện của khách mời nhưng ít có đại sự kiện crossover thực sự. Phần đầu thứ tự đọc bao gồm nhiều miniseries diễn ra theo trình tự thời gian trước và trong giai đoạn xuất bản đầu tiên của Marvel.'
    },
    {
      en: 'Containing the second most first appearances of significant characters,  we see the introduction of some extremely popular heroes,  especially among the X-Men.  We also see the first significant crossover when the Avengers battle the Defenders.  This part of the reading order also contains some of the most popular X-Men storylines of all time;  the Phoenix Saga,  Dark Phoenix Saga,  and Days of Future Past.',
      vi: 'Giai đoạn có số lượng nhân vật nổi bật xuất hiện lần đầu nhiều thứ hai, chứng kiến màn ra mắt của hàng loạt siêu anh hùng được yêu thích, đặc biệt là nhóm X-Men. Chúng ta cũng chứng kiến sự kiện crossover quy mô đầu tiên khi Avengers đối đầu Defenders. Phần này cũng bao gồm những cốt truyện X-Men kinh điển nhất mọi thời đại: Phoenix Saga, Dark Phoenix Saga và Days of Future Past.'
    },
    {
      en: 'Here we see the birth of large scale crossover events.  Contest of Champions is Marvel&#8217;s first Limited Series and serves as a sort of prototype for the line-wide crossovers to follow.  The original Secret Wars event is wildly successful and its less successful sequel comes out a year later.  The X-Men line expands with the introduction of X-Factor and the New Mutants.  The popular villain Apocalypse is introduced and we see the beginnings of the symbiote that will go one to become Venom.',
      vi: 'Nơi khai sinh ra các sự kiện crossover quy mô lớn. Contest of Champions là Limited Series đầu tiên của Marvel và đóng vai trò như hình mẫu thử nghiệm cho các sự kiện liên kết toàn vũ trụ sau này. Đại sự kiện Secret Wars đầu tiên đạt thành công vang dội. Nhánh truyện X-Men mở rộng với sự xuất hiện của X-Factor và New Mutants. Ác nhân huyền thoại Apocalypse chính thức ra mắt và chúng ta thấy sự khởi đầu của loài symbiote sau này trở thành Venom.'
    },
    {
      en: 'Now we really see the crossover events swing into high gear.  The Infinity Gauntlet event takes place,  one of the greatest comic events ever.  Venom,  Gambit,  and the mutant group X-Force are introduced and prove to be immensely popular.  In the comic book business the speculator market is in full swing but its end is already in sight.',
      vi: 'Các sự kiện crossover bắt đầu bước vào giai đoạn bùng nổ đỉnh điểm. Sự kiện Infinity Gauntlet diễn ra, trở thành một trong những sự kiện truyện tranh vĩ đại nhất mọi thời đại. Venom, Gambit và nhóm dị nhân X-Force ra mắt và nhanh chóng tạo nên cơn sốt khổng lồ. Về mặt thị trường truyện tranh, làn sóng đầu cơ đạt đến đỉnh cao trước khi bước vào giai đoạn thoái trào.'
    },
    {
      en: 'The 90&#8217;s &#8220;Dark Age of Comics&#8221; is in full swing.  If you are a fan of pouches you are in luck.  We see the seminal X-Men event Age of Apocalypse as well as the will-it-ever-end Spider-Man event Second Clone Saga.  The first of several Marvel Alternate Universes are printed in this era;  the futuristic Marvel 2099 and the MC2 universe,  which mainly featured Spider-Girl.  Near the end of this section we see many of the most popular and long-running Marvel series relaunched with new #1 issues that will serve as a good jumping on point for new readers.  In the comic business world the market crashes and the industry is devastated.',
      vi: 'Thời kỳ "Dark Age of Comics" của thập niên 90 diễn ra sôi động. Chúng ta chứng kiến đại sự kiện X-Men kinh điển Age of Apocalypse cũng như chuỗi sự kiện Second Clone Saga kéo dài của Spider-Man. Những vũ trụ song song (Alternate Universes) đầu tiên của Marvel được ra mắt trong kỷ nguyên này, gồm tương lai Marvel 2099 và vũ trụ MC2 xoay quanh Spider-Girl. Về cuối giai đoạn này, nhiều bộ truyện dài kỳ được tái khởi động lại từ tập #1 tạo điểm bắt đầu thuận tiện cho người mới.'
    },
    {
      en: 'Here we see the start of Grant Morrison&#8217;s work on the X-Men with New X-Men #114 which can be seen as the start of the &#8220;Modern Age of Marvel&#8221; and serves as an excellent point to begin reading Marvel comics as it forms the basis for the X-Men moving forward and the beginning of the modern mega events is just around the corner.',
      vi: 'Mở màn cho chặng đường sáng tác xuất sắc của Grant Morrison trên New X-Men #114, được xem là mốc khởi đầu của "Kỷ nguyên Hiện đại của Marvel" (Modern Age of Marvel). Đây là điểm bắt đầu tuyệt vời để bước chân vào Marvel Comics, đặt nền móng vững chắc cho hướng phát triển của X-Men và chuẩn bị cho kỷ nguyên các đại sự kiện hiện đại bùng nổ.'
    },
    {
      en: 'The era of Marvel mega events starts here with the Avengers Disassembled event and the beginning of the New Avengers series.  Following that we have House of M which will have repercussions through the various X-Men books for years to come.  Garth Ennis&#8217; fantastic run on Punisher continues with Punisher Vol. 6 under the MAX imprint.',
      vi: 'Kỷ nguyên của các đại sự kiện Marvel chính thức bùng nổ tại đây với Avengers Disassembled và sự ra mắt của bộ truyện New Avengers. Ngay sau đó là House of M để lại hậu quả chấn động kéo dài nhiều năm qua các đầu truyện X-Men. Chặng đường huyền thoại của Garth Ennis trên Punisher tiếp tục với Punisher Vol. 6 dưới nhãn MAX.'
    },
    {
      en: 'Start off with Civil War,  one of the biggest Marvel events ever,  and follow that with the excellent Planet Hulk and Annihilation events,  a string of X-Men events,  the Wolverine storyline Old Man Logan,  and then finish it all off with the massive Secret Invasion event and you have a packed reading order.  Unfortunately One More Day also takes place during this time.',
      vi: 'Khởi đầu với Civil War - một trong những sự kiện lớn nhất lịch sử Marvel, tiếp nối bằng các siêu phẩm Planet Hulk và Annihilation, một chuỗi sự kiện dồn dập của X-Men, cốt truyện Old Man Logan của Wolverine, và khép lại hoành tráng bằng đại sự kiện Secret Invasion tạo nên một lộ trình đọc dày đặc và kịch tính. Sự kiện One More Day gây tranh cãi của Spider-Man cũng diễn ra trong giai đoạn này.'
    },
    {
      en: 'The tightly packed events continue.  The cosmic saga of Marvel,  which is one of the highlights of recent Marvel history,  continues with War of Kings,  Realm of Kings,  and The Thanos Imperative.  The status quo after Secret Invasion is explored in the 300!? issue Dark Reign era.  Siege marks the culmination of events that started with Avengers Disassembled.',
      vi: 'Các sự kiện dồn dập nối tiếp nhau không ngừng. Sử thi vũ trụ Marvel - một trong những điểm nhấn xuất sắc nhất lịch sử hiện đại - thăng hoa với War of Kings, Realm of Kings và The Thanos Imperative. Cục diện hậu Secret Invasion được khắc họa sâu sắc qua kỷ nguyên Dark Reign quy mô đồ sộ. Đại chiến Siege đánh dấu hồi kết viên mãn cho chuỗi biến cố khởi nguồn từ Avengers Disassembled.'
    },
    {
      en: 'Welcome to Part 12 of the Marvel Master Reading Order.',
      vi: 'Chào mừng bạn đến với Phần 12 của Thứ Tự Đọc Marvel Toàn Diện, bao gồm giai đoạn Hellfire Gala, Last Annihilation, Death of Doctor Strange và sự kiện đen tối Devil\'s Reign.'
    },
    {
      en: 'The Marvel Master Reading Order rolls on with Part 13. I promise to expand this at some point.',
      vi: 'Thứ Tự Đọc Marvel Toàn Diện tiếp tục với Phần 13, đưa độc giả qua các đại sự kiện quy mô như A.X.E.: Judgment Day, Avengers Assemble, Dark Web và Sins of Sinister.'
    },
    {
      en: 'Covering the end of the Krakoa era of the X-Men.  Other stuff happens as well.',
      vi: 'Bao trọn hồi kết của kỷ nguyên đảo quốc Krakoa của các dị nhân X-Men, cùng các sự kiện lớn như Gang War và đại dịch ma cà rồng Blood Hunt.'
    },
    {
      en: 'With the Blood Hunt concluded, Marvel shifted into a rebuild-and-escalate phase, exploring how the world recovers from supernatural catastrophe while setting the stage for even larger threats. One World Under Doom emerged as the flagship storyline, positioning Doctor Doom as a global political force offering “order” in the chaos left behind. Marvel also launched Age of Revelations, a thematic umbrella for a wide range of titles dealing with multiversal anomalies, cosmic warnings, and the return of long-sleeping forces.',
      vi: 'Khi sự kiện Blood Hunt khép lại, Marvel bước vào giai đoạn tái thiết và leo thang căng thẳng mới. Trọng tâm là sự kiện One World Under Doom khi Doctor Doom vươn lên thành thế lực chính trị áp đặt trật tự toàn cầu giữa lúc hỗn loạn, cùng kỷ nguyên Age of Revelation mở ra những biến động đa vũ trụ và sự trỗi dậy của các thực thể cổ xưa.'
    }
  ];

  for (const item of marvelPartDesc) {
    if (content.includes(item.en)) {
      content = content.replace(item.en, item.vi);
    }
  }

  fs.writeFileSync(marvelMasterFile, content, 'utf8');
  console.log('Localised marvel/marvel-master-reading-order/index.html');
}

// 2. UPDATE dc/dc-master-reading-order/index.html
const dcMasterFile = path.join(rootDir, 'dc', 'dc-master-reading-order', 'index.html');
if (fs.existsSync(dcMasterFile)) {
  let content = fs.readFileSync(dcMasterFile, 'utf8');

  content = replaceLabels(content);
  content = replacePartNav(content);

  const dcPartDesc = [
    {
      en: 'The first part of the order contains all the Pre-Crisis comics and ends with the Crisis on Infinite Earths event.  The beginning of the order starts off heavily with the Superman Family but gradually other characters are brought in.  A lot of the Golden and Silver age comics rely on extreme amounts of coincidence for their plots,  which doesn&#8217;t always make for the easiest reading.  If you are mainly interested in the Post-Crisis DC Universe you should skip this part and begin reading at Part 2.',
      vi: 'Phần đầu tiên bao gồm toàn bộ truyện tranh thời kỳ Tiền Khủng Hoảng (Pre-Crisis) và khép lại với đại sự kiện Crisis on Infinite Earths. Giai đoạn đầu tập trung chủ yếu vào Superman Family rồi dần mở rộng sang các nhân vật khác. Nếu bạn chủ yếu quan tâm đến Vũ trụ DC thời kỳ Hậu Khủng Hoảng (Post-Crisis), bạn có thể bỏ qua phần này và bắt đầu trực tiếp từ Phần 2.'
    },
    {
      en: 'The beginning of the Post-Crisis era.  We start off with a high concentration of some of the most iconic Batman stories of all time;  Year One,  The Long Halloween,  Dark Victory,  Killing Joke,  and A Lonely Place of Dying.   Also featured is the excellent Man of Steel limited series and the Post-Crisis origins of many of the biggest DC superheroes.  Post-Crisis we also see the beginning of large crossover events.',
      vi: 'Khởi đầu của kỷ nguyên Hậu Khủng Hoảng (Post-Crisis). Mở màn bằng sự hội tụ của những câu chuyện Batman kinh điển nhất mọi thời đại: Year One, The Long Halloween, Dark Victory, The Killing Joke và A Lonely Place of Dying. Cùng với đó là miniseries Man of Steel xuất sắc và nguồn gốc Hậu Khủng Hoảng của nhiều siêu anh hùng DC vĩ đại nhất, mở đường cho các đại sự kiện crossover quy mô lớn.'
    },
    {
      en: 'Along with the annual crossover events we also see two of the biggest comic events of the 90&#8217;s;  Death of Superman and the Knightfall Saga.  These two events helped fuel the speculator boom of the early 90&#8217;s and ultimately played a significant part in the collapse of the comic book market.  The Batman: Contagion event marks the beginning of a series of events that will culminate in Batman: No Man&#8217;s Land several years later.  Zero Hour is the second of DC&#8217;s large &#8220;Crisis&#8221; events.',
      vi: 'Bên cạnh các sự kiện crossover hàng năm, chúng ta chứng kiến hai trong số những sự kiện truyện tranh lớn nhất thập niên 90: Death of Superman và chuỗi truyện Knightfall Saga. Sự kiện Batman: Contagion đánh dấu bước khởi đầu cho chuỗi biến cố sẽ bùng nổ thành Batman: No Man\'s Land sau đó vài năm. Zero Hour là đại sự kiện Crisis thứ hai trong lịch sử DC.'
    },
    {
      en: 'This part of the reading order starts off with a revamped Justice League being written by Grant Morrison and also sees the return of the Justice Society.  The DC One Million event depicts the DC Universe 83,000 years in the future.  Gotham City continues to have a bad time in Batman: Cataclysm and the government finally says enough is enough in Batman: No Man&#8217;s Land.',
      vi: 'Phần này khởi đầu với sự tái sinh của Justice League dưới ngòi bút xuất sắc của Grant Morrison cùng sự trở lại của Justice Society. Đại sự kiện DC One Million khắc họa Vũ trụ DC ở mốc 83.000 năm trong tương lai. Gotham City tiếp tục trải qua thảm họa trong Batman: Cataclysm và đỉnh điểm là khi chính phủ cô lập hoàn toàn thành phố trong Batman: No Man\'s Land.'
    },
    {
      en: 'The popular Batman storyline Hush takes place in this part of the order and we have an updated version of Superman&#8217;s Post-Crisis origin with the the Superman: Birthright limited series.  The Dark Knight Returns and The Dark Knight Strikes Again are placed in this section since they have to appear somewhere.  We also have the excellent alternate universe Superman: Red Son limited series.',
      vi: 'Cốt truyện Batman nổi tiếng Hush diễn ra trong giai đoạn này, đi kèm phiên bản làm mới nguồn gốc Superman thời Hậu Khủng Hoảng với Superman: Birthright. Các tác phẩm kinh điển The Dark Knight Returns, The Dark Knight Strikes Again cũng như bộ truyện vũ trụ song song xuất sắc Superman: Red Son cũng được xếp vào phần này.'
    },
    {
      en: 'And here we go.  First up is Identity Crisis,  followed by the massive Countdown to Infinite Crisis and then the Infinite Crisis event itself.  This is followed by the 52 limited series and the One Year Later storylines,  which explore the changes in the status quo of various heroes after the Infinite Crisis event.  During the Countdown to Infinite Crisis we have the excellent Green Lantern: Rebirth limited series and the beginning of Geoff Johns epic run with the character.',
      vi: 'Giai đoạn bùng nổ đỉnh cao: Mở đầu là Identity Crisis, tiếp nối bằng chiến dịch Countdown to Infinite Crisis rồi bước vào chính đại sự kiện Infinite Crisis. Liền sau đó là bộ truyện 52 kỳ công và các cốt truyện One Year Later khám phá sự thay đổi của các siêu anh hùng. Giai đoạn này cũng ghi dấu miniseries Green Lantern: Rebirth mở màn cho chặng đường sử thi của Geoff Johns.'
    }
  ];

  for (const item of dcPartDesc) {
    if (content.includes(item.en)) {
      content = content.replace(item.en, item.vi);
    }
  }

  fs.writeFileSync(dcMasterFile, content, 'utf8');
  console.log('Localised dc/dc-master-reading-order/index.html');
}

// 3. UPDATE ALL PART SUBPAGES (marvel-master-reading-order-part-1..15, dc-master-reading-order-part-1..8)
const allPartPaths = [
  ...Array.from({length: 15}, (_, i) => ({
    dir: `marvel/marvel-master-reading-order-part-${i+1}`,
    partNum: i + 1,
    universe: 'Marvel'
  })),
  ...Array.from({length: 8}, (_, i) => ({
    dir: `dc/dc-master-reading-order-part-${i+1}`,
    partNum: i + 1,
    universe: 'DC'
  }))
];

for (const { dir, partNum, universe } of allPartPaths) {
  const filePath = path.join(rootDir, dir, 'index.html');
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');

  // Breadcrumb
  const origBreadcrumb = `${universe} Master Reading Order Part ${partNum}`;
  const viBreadcrumb = `Thứ Tự Đọc ${universe} Toàn Diện - Phần ${partNum}`;
  content = content.replace(
    `<span itemprop="name">${origBreadcrumb}</span>`,
    `<span itemprop="name">${viBreadcrumb}</span>`
  );
  content = content.replace(
    `<span itemprop="name">${universe} Master Reading Order</span>`,
    `<span itemprop="name">Thứ Tự Đọc ${universe} Toàn Diện</span>`
  );

  // Main Heading h2
  content = content.replace(
    `<strong>${origBreadcrumb}</strong>`,
    `<strong>${viBreadcrumb}</strong>`
  );

  // Counter
  content = content.replace(/<div class="x-counter-before">\s*ISSUES\s*<\/div>/g, '<div class="x-counter-before">TẬP TRUYỆN</div>');
  content = content.replace(/<div class="x-counter-after">\s*NOT INCLUDING EVENTS\s*<\/div>/g, '<div class="x-counter-after">Không bao gồm các sự kiện phụ</div>');

  // Part nav
  content = replacePartNav(content);

  // Fix specific bad cornerstone placeholder in Marvel Part 13
  if (dir.includes('marvel-master-reading-order-part-13')) {
    content = content.replace(
      'Nhập văn bản của bạn ở đây! Phần tử văn bản dành cho bản sao dài có khả năng bao gồm nhiều đoạn văn.',
      'Thứ Tự Đọc Marvel Toàn Diện tiếp tục với Phần 13, đưa độc giả qua các đại sự kiện quy mô như A.X.E.: Judgment Day, Avengers Assemble, Dark Web và Sins of Sinister.'
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Localised ${dir}/index.html`);
}
