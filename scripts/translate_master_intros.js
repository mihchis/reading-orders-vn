const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. marvel/marvel-master-reading-order/index.html
const marvelMasterPath = path.join(rootDir, 'marvel', 'marvel-master-reading-order', 'index.html');
if (fs.existsSync(marvelMasterPath)) {
  let content = fs.readFileSync(marvelMasterPath, 'utf8');

  content = content.replace(
    'The X-Men split apart and then battle the Avengers.  In 2012 Marvel NOW! starts and provides an excellent starting point for readers new to Marvel comics.  Years of storylines culminate in the Secret Wars (2015) event which makes way for an All-New All-Different Marvel.',
    'Các X-Men chia rẽ và sau đó đối đầu với Avengers. Năm 2012, Marvel NOW! khởi động và mang đến điểm bắt đầu tuyệt vời cho độc giả mới của Marvel Comics. Nhiều năm cốt truyện đạt đến đỉnh điểm trong sự kiện Secret Wars (2015), mở đường cho All-New All-Different Marvel.'
  );

  content = content.replace(
    'Welcome to the Marvel NOW! Reading Order.  Marvel NOW! presents a shift in the Marvel Universe following the Avengers vs. X-Men event and was designed as a jumping on point for new readers and featured many changes to character status quos,  alter egos,  and costumes.  Marvel NOW! ended with the conclusion of the Secret Wars (2015) event and made way for All-New All-Different Marvel.',
    'Chào mừng bạn đến với Thứ Tự Đọc Marvel NOW!. Marvel NOW! đánh dấu bước chuyển mình lớn của Vũ trụ Marvel sau sự kiện Avengers vs. X-Men, được thiết kế làm điểm khởi đầu lý tưởng cho độc giả mới với nhiều thay đổi về hiện trạng nhân vật, danh tính và trang phục. Kỷ nguyên Marvel NOW! khép lại với sự kiện Secret Wars (2015) và mở đường cho All-New All-Different Marvel.'
  );

  content = content.replace(
    'Coming after the Secret Wars (2015) event is an All-New, All-Different Marvel;  meant to reveal the state of the post-Secret Wars Marvel Universe and provide a jumping on point for new readers.  Even though after the Civil War II event Marvel began to reuse the Marvel NOW! banner on comic books,  for simplicity’s sake this reading order considers everything post-Secret Wars (2015) to the beginning of Marvel Legacy to be All-New, All-Different Marvel.',
    'Tiếp nối sự kiện Secret Wars (2015) là All-New, All-Different Marvel; hé lộ diện mạo mới của Vũ trụ Marvel hậu Secret Wars và mở ra điểm tiếp cận cho độc giả mới. Mặc dù sau sự kiện Civil War II Marvel bắt đầu dùng lại biểu ngữ Marvel NOW! trên các đầu truyện, để thuận tiện theo dõi, danh sách thứ tự đọc này coi toàn bộ giai đoạn từ hậu Secret Wars (2015) đến trước Marvel Legacy là All-New, All-Different Marvel.'
  );

  content = content.replace(
    'A relaunch following the Secret Empire event, Marvel Legacy attempted to bring a greater focus to Marvel&#8217;s core superheroes. It saw the return of Bruce Banner as Hulk, Tony Stark as Iron Man, and Thor Odinson reclaiming the hammer Mjolnir. Wolverine, Jean Grey, and Franklin and Valeria Richards are all back; while the Thing and Human Torch search for Sue and Reed Richards, who have been missing since Secret Wars.',
    'Đợt tái khởi động sau sự kiện Secret Empire, Marvel Legacy hướng sự chú ý trở lại các siêu anh hùng nòng cốt của Marvel. Giai đoạn này chứng kiến Bruce Banner trở lại làm Hulk, Tony Stark trở lại làm Iron Man, và Thor Odinson lấy lại cây búa Mjolnir. Wolverine, Jean Grey cùng Franklin và Valeria Richards đều quay trở lại; trong khi the Thing và Human Torch đi tìm Sue và Reed Richards, những người mất tích kể từ Secret Wars.'
  );

  content = content.replace(
    'During Marvel Legacy many series returned to using their legacy numbering.',
    'Trong suốt Marvel Legacy, nhiều bộ truyện đã quay trở lại cách đánh số tập truyền thống (legacy numbering).'
  );

  content = content.replace(
    'A Fresh Start saw the return of Tony Stark, Steve Rogers, Logan, Odinson and Bruce Banner to their classic identities of Iron Man, Captain America, Wolverine, Thor and Hulk respectively. The War of the Realms event caps off a seven year run of Thor stories by Jason Aaron. Also Marvel decides to go overboard with all the limited series and one-shots.',
    'A Fresh Start chứng kiến Tony Stark, Steve Rogers, Logan, Odinson và Bruce Banner quay về với các danh tính kinh điển gồm Iron Man, Captain America, Wolverine, Thor và Hulk. Sự kiện War of the Realms khép lại chặng đường 7 năm chấp bút truyện Thor của Jason Aaron.'
  );

  content = content.replace(
    'Continuing from A Fresh Start the Marvel Universe rolls on. A new era for the X-Men begins, overseen by Jonathan Hickman.',
    'Tiếp nối A Fresh Start, Vũ trụ Marvel tiếp tục vận động không ngừng. Một kỷ nguyên hoàn toàn mới cho X-Men chính thức mở màn dưới sự chỉ đạo của Jonathan Hickman.'
  );

  fs.writeFileSync(marvelMasterPath, content, 'utf8');
  console.log('Updated marvel/marvel-master-reading-order/index.html');
}

// 2. dc/dc-master-reading-order/index.html
const dcMasterPath = path.join(rootDir, 'dc', 'dc-master-reading-order', 'index.html');
if (fs.existsSync(dcMasterPath)) {
  let content = fs.readFileSync(dcMasterPath, 'utf8');

  content = content.replace(
    'We have yet another &#8220;Crisis&#8221; event with Final Crisis,  which has major repercussions within the Batman Family series of comics.  There are several huge events such as Blackest Night,  Brightest Day,  and Superman: New Krypton.  Then there is Flashpoint which radically changes the DC Universe and ushers in the New 52 era.',
    'Chúng ta có thêm một đại sự kiện &#8220;Crisis&#8221; với Final Crisis, để lại những tác động sâu sắc trong dòng truyện Batman Family. Tiếp đó là hàng loạt sự kiện quy mô như Blackest Night, Brightest Day, và Superman: New Krypton. Cuối cùng là Flashpoint làm biến đổi toàn diện Vũ trụ DC và mở ra kỷ nguyên New 52.'
  );

  content = content.replace(
    'Welcome to the New 52 Reading Order. This is a reading order for all DC comics published under the New 52 line, beginning after the Flashpoint event and ending with the Convergence event. The continuity of the New 52 continues in the DC You Reading Order.',
    'Chào mừng bạn đến với Thứ Tự Đọc New 52. Đây là thứ tự đọc cho tất cả các đầu truyện DC xuất bản dưới thương hiệu New 52, bắt đầu sau sự kiện Flashpoint và kết thúc bằng sự kiện Convergence. Tính liên tục của New 52 tiếp tục được duy trì trong Thứ Tự Đọc DC You.'
  );

  content = content.replace(
    'Welcome to the DC You Reading Order.  Following the Convergence event the New 52 branding was dropped from all DC comics and was replaced by the DC You branding.  DC You begins after the Convergence event and ends with DC Rebirth.',
    'Chào mừng bạn đến với Thứ Tự Đọc DC You. Sau sự kiện Convergence, thương hiệu New 52 được lược bỏ khỏi các đầu truyện DC và thay thế bằng DC You. Kỷ nguyên DC You bắt đầu từ sau Convergence và khép lại với DC Rebirth.'
  );

  content = content.replace(
    'Welcome to the DC Rebirth Reading Order.  This is a reading order for all DC comics published in the Rebirth era,  beginning with DC Universe: Rebirth #1 and currently ongoing.  It proceeds directly after the <a href="../events/new-52-reading-order/index.html" class="dc-class">New 52</a> and <a href="../events/dc-you-reading-order/index.html" class="dc-class">DC You</a> reading orders.',
    'Chào mừng bạn đến với Thứ Tự Đọc DC Rebirth. Đây là thứ tự đọc cho tất cả các đầu truyện DC xuất bản trong kỷ nguyên Rebirth, khởi đầu bằng DC Universe: Rebirth #1. Kỷ nguyên này tiếp nối trực tiếp sau các thứ tự đọc <a href="../events/new-52-reading-order/index.html" class="dc-class">New 52</a> và <a href="../events/dc-you-reading-order/index.html" class="dc-class">DC You</a>.'
  );

  content = content.replace(
    'The New 52, DC You, and DC Rebirth reading orders only contain in-continuity comic issues. This part of the reading order is dedicated to the non-canon comics DC has released since 2011. Non-canon comics in the Infinite Frontier era will also be added to this reading order.',
    'Các thứ tự đọc New 52, DC You và DC Rebirth chỉ bao gồm các tập truyện thuộc dòng thời gian chính (canon). Phần thứ tự đọc này dành riêng cho các đầu truyện ngoài dòng thời gian (non-canon) mà DC phát hành từ năm 2011 trở đi.'
  );

  fs.writeFileSync(dcMasterPath, content, 'utf8');
  console.log('Updated dc/dc-master-reading-order/index.html');
}
