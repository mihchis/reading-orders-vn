/**
 * scripts/translate_phase1.js
 * Dịch thuật Giai đoạn 1: Tuyển tập ~45-50 Nhân vật & Sự kiện Huyền thoại / Đọc nhiều nhất
 */
const fs = require('fs');
const path = require('path');

const phase1Data = {
  // ==========================================
  // 1. MARVEL CHARACTERS
  // ==========================================
  'marvel/characters/spider-man-reading-order/index.html': {
    bio: 'Tại một buổi triển lãm khoa học, Peter Parker vô tình bị một chú nhện nhiễm phóng xạ cắn trúng và sở hữu sức mạnh, sự nhanh nhẹn phi thường cùng khả năng bám dính trên các bức tường. Bằng trí tuệ thiên tài về khoa học, cậu chế tạo ra thiết bị bắn tơ độc đáo đeo ở cổ tay. Ban đầu chỉ muốn dùng năng lực để kiếm tiền, nhưng sau cái chết bi thảm của người bác Ben mà cậu có thể ngăn chặn, Peter đã thấu hiểu chân lý vĩ đại: "Sức mạnh càng lớn, trách nhiệm càng cao" và chính thức trở thành người hùng Spider-Man bảo vệ New York.',
    powers: 'Bám tường, Siêu sức mạnh, Tốc độ, Sức bền, Sự nhanh nhẹn và Phản xạ phi thường, Giác quan nhện (Spider-Sense), Ý chí bất khuất, Trí tuệ thiên tài.'
  },
  'marvel/characters/iron-man-reading-order/index.html': {
    bio: 'Tony Stark là một nhà sáng chế thiên tài kiêm tỷ phú điều hành tập đoàn Stark Industries. Sau khi bị thương nặng ở ngực bởi mảnh đạn và bị bắt cóc bởi những kẻ khủng bố, anh đã chế tạo một bộ giáp công nghệ cao để tự cứu sống bản thân và thoát khỏi cảnh giam cầm. Trở về quê nhà, anh nâng cấp bộ giáp và quyết định dùng tiềm lực công nghệ cùng tài sản khổng lồ để bảo vệ nhân loại dưới danh xưng Iron Man – đồng thời là một trong những thành viên trụ cột sáng lập nên biệt đội Avengers.',
    powers: 'Trí tuệ thiên tài, Bậc thầy kỹ thuật cơ khí & máy tính; Bộ giáp Iron Man cung cấp: Siêu sức mạnh, Tốc độ bay siêu thanh, Tia đẩy Repulsor, Giáp bảo hộ năng lượng cao, Hệ thống vũ khí tối tân.'
  },
  'marvel/characters/captain-america-reading-order/index.html': {
    bio: 'Steve Rogers là một thanh niên nhỏ bé nhưng tràn đầy lòng quả cảm và tinh thần yêu nước, đã tình nguyện tham gia vào một dự án quân sự tuyệt mật trong Thế chiến thứ II. Được tiêm Huyết thanh Siêu chiến binh (Super-Soldier Serum), thể chất của anh được cường hóa đạt đến đỉnh cao tuyệt đối của con người. Khoác lên mình bộ trang phục mang biểu tượng cờ Mỹ cùng chiếc khiên Vibranium bất hoại, Captain America đã trở thành biểu tượng vĩ đại của tự do và là người thủ lĩnh huyền thoại của biệt đội Avengers.',
    powers: 'Thể chất con người ở mức đỉnh cao tuyệt đối (Sức mạnh, Tốc độ, Sức bền, Phản xạ), Khả năng phục hồi nhanh, Bậc thầy võ thuật cận chiến, Bậc thầy chiến thuật và Lãnh đạo xuất chúng, Kỹ năng ném khiên hoàn hảo.'
  },
  'marvel/characters/wolverine-reading-order/index.html': {
    bio: 'James "Logan" Howlett là một dị nhân (mutant) sở hữu năng lực tự chữa lành phi thường, các giác quan sắc bén như loài dã thú và bộ móng vuốt có thể co rút ở hai bàn tay. Từng là đối tượng thí nghiệm của chương trình tuyệt mật Weapon X, toàn bộ khung xương của anh đã được phủ một lớp kim loại Adamantium gần như không thể phá hủy. Dù mang bản năng dã man dữ dội, Wolverine luôn kiên định chiến đấu vì lý tưởng của loài dị nhân cùng X-Men và là một trong những chiến binh anh dũng nhất thế giới comics.',
    powers: 'Khả năng hồi phục thần tốc (Healing Factor), Khung xương và móng vuốt Adamantium bất hoại, Giác quan siêu nhạy, Phản xạ và Thể lực siêu việt, Miễn nhiễm độc tố, Bậc thầy cận chiến.'
  },
  'marvel/characters/thor-reading-order/index.html': {
    bio: 'Thor Odinson là Thần Sấm của xứ Asgard, một chiến binh dũng mãnh sở hữu chiếc búa thần kỳ Mjolnir quyền năng. Nhằm dạy cho anh bài học về lòng khiêm nhường, phụ vương Odin đã tước đi ký ức và đày anh xuống Trái Đất trong thân phận bác sĩ Donald Blake. Sau khi tìm lại được danh tính thần thánh và chiếc búa thiêng, Thor đã nguyện cống hiến sức mạnh của mình để bảo vệ cả Midgard (Trái Đất) lẫn Asgard, trở thành một trong những người hùng hùng mạnh nhất của Avengers.',
    powers: 'Sức mạnh thần thánh vô song, Thao túng sấm sét và thời tiết, Khả năng bay lượn (nhờ Mjolnir), Sức bền và Tuổi thọ thần linh bất tử, Khả năng du hành xuyên không gian.'
  },
  'marvel/characters/hulk-reading-order/index.html': {
    bio: 'Nhà vật lý hạt nhân thiên tài Bruce Banner đã vô tình bị phơi nhiễm một lượng bức xạ tia Gamma khổng lồ khi quên mình cứu một thiếu niên khỏi bãi thử nghiệm bom. Kể từ đó, mỗi khi cảm xúc bị kích động hoặc nổi giận, anh biến đổi thành The Hulk – một người khổng lồ da xanh sở hữu sức mạnh cơ bắp không giới hạn. Càng tức giận, Hulk càng trở nên mạnh mẽ, trở thành một thế lực hủy diệt vừa đáng sợ vừa là người bảo vệ bất đắc dĩ của Trái Đất.',
    powers: 'Sức mạnh cơ bắp vô hạn tăng tiến theo cơn giận, Bất khả xâm phạm, Bật nhảy siêu xa xuyên lục địa, Khả năng tự chữa lành tức thì, Thể lực và Sức chịu đựng vô tận.'
  },
  'marvel/characters/deadpool-reading-order/index.html': {
    bio: 'Wade Wilson là một lính đánh thuê lắm mồm bị chẩn đoán mắc bệnh ung thư giai đoạn cuối. Để cứu mạng mình, anh tham gia vào chương trình Weapon X và được cấy ghép tế bào chữa lành nhân tạo của Wolverine. Thí nghiệm đã chữa khỏi căn bệnh ung thư nhưng để lại cho anh một diện mạo biến dạng và tâm trí hỗn loạn. Với khiếu hài hước kỳ quặc, khả năng phá vỡ "bức tường thứ tư" (nói chuyện với độc giả) và kỹ năng tác chiến siêu hạng, Deadpool là "tên lính đánh thuê lắm mồm" nổi tiếng nhất thế giới comic.',
    powers: 'Khả năng tự chữa lành siêu đẳng (bất tử), Phá vỡ bức tường thứ tư (Fourth Wall), Bậc thầy sử dụng mọi loại vũ khí, Thiện xạ và Kiếm thuật đỉnh cao, Tâm trí không thể bị thao túng ngoại cảm.'
  },
  'marvel/characters/daredevil-reading-order/index.html': {
    bio: 'Khi còn là một cậu bé, Matt Murdock bị mù trong một vụ tai nạn xe tải chở hóa chất phóng xạ khi lao ra cứu một người đàn ông mù khác. Đổi lại, các giác quan còn lại của cậu được cường hóa đạt đến cấp độ siêu phàm, đồng thời phát triển thêm một "giác quan radar" cho phép cảm nhận không gian chuẩn xác hơn cả mắt thường. Lớn lên trở thành một luật sư đấu tranh cho công lý tại Hell\'s Kitchen vào ban ngày, ban đêm Matt khoác lên mình bộ trang phục Daredevil – "Người Đàn Ông Không Biết Sợ" để trừng trị tội phạm.',
    powers: 'Giác quan Radar 360 độ, Thính giác - Khứu giác - Xúc giác siêu phàm, Thể lực đỉnh cao con người, Bậc thầy võ thuật cận chiến, Chuyên gia sử dụng gậy Billy Club, Trí tuệ pháp lý xuất sắc.'
  },
  'marvel/characters/thanos-reading-order/index.html': {
    bio: 'Thanos là một Eternal sinh ra trên mặt trăng Titan của Sao Thổ mang trong mình đột biến Deviant Syndome khiến vẻ ngoài của hắn trở nên dị dạng và đáng sợ. Sở hữu trí tuệ uyên thâm vượt bậc cùng niềm đam mê bệnh hoạn với cái chết, hắn tôn thờ và phục tùng hiện thân của Cái Chết (Mistress Death). Thanos khét tiếng khắp vũ trụ với biệt danh "Mad Titan", không ngừng săn tìm các nguồn sức mạnh tối thượng như Khối Cosmic Cube và Găng tay Vô cực để thực hiện tham vọng xóa sổ sự sống.',
    powers: 'Siêu sức mạnh và Thể chất cấp độ Thần thánh, Bất tử, Thao túng năng lượng Cosmic, Trí tuệ chiến lược thiên tài, Khả năng dịch chuyển tức thời và Thần giao cách cảm.'
  },
  'marvel/characters/doctor-strange-reading-order/index.html': {
    bio: 'Stephen Strange từng là một bác sĩ giải phẫu thần kinh kiêu ngạo nhưng vô cùng tài ba. Sau một tai nạn xe hơi kinh hoàng làm hủy hoại hoàn toàn đôi bàn tay, anh đã tiêu tốn toàn bộ tài sản tìm kiếm phương thuốc chữa trị và đặt chân đến Kamar-Taj huyền bí. Dưới sự chỉ dạy của Thượng Cổ Tôn Giả (Ancient One), Strange đã khai mở tâm trí, học hỏi các bí thuật ma thuật cổ xưa và cuối cùng kế thừa danh hiệu Phù Thủy Tối Thượng (Sorcerer Supreme) bảo vệ Trái Đất khỏi các mối đe dọa đa chiều không gian.',
    powers: 'Bậc thầy Phù Thủy Tối Thượng (Mystic Arts), Thao túng thực tại và Không-Thời gian, Tạo khiên và Vũ khí năng lượng phép thuật, Du hành xuất hồn (Astral Projection), Sở hữu các bảo vật: Áo choàng Bay (Cloak of Levitation) và Con mắt Agamotto (Eye of Agamotto).'
  },
  'marvel/characters/venom-reading-order/index.html': {
    bio: 'Venom là sự kết hợp cộng sinh giữa một sinh vật vô định hình ngoài hành tinh (Klyntar Symbiote) và một vật chủ con người – nổi tiếng nhất là cựu phóng viên Eddie Brock. Sau khi bị Spider-Man từ chối, sinh vật Symbiote đã tìm đến Brock, người cũng ôm lòng thù hận sâu sắc với người nhện. Cùng nhau, họ trở thành Venom. Khởi đầu là một trong những kẻ thù nguy hiểm nhất của Spider-Man, Venom dần tiến hóa thành một "Kẻ Hộ Vệ Độc Ác" (Lethal Protector) bảo vệ những người vô tội.',
    powers: 'Tất cả năng lực của Spider-Man (Bám tường, Phóng tơ tằm sinh học), Siêu sức mạnh vượt trội Spider-Man, Biến hình và Ngụy trang hòa lẫn môi trường, Miễn nhiễm với Giác quan nhện, Khả năng tự chữa lành cho vật chủ.'
  },
  'marvel/characters/punisher-reading-order/index.html': {
    bio: 'Frank Castle là một cựu lính thủy đánh bộ Mỹ (US Marine) dày dặn kinh nghiệm tác chiến. Sau khi vợ và con của anh bị sát hại dã man trong một cuộc thanh toán của các băng đảng mafia tại Công viên Trung tâm, Frank đã tuyên bố một cuộc chiến tranh một người không khoan nhượng chống lại toàn bộ thế giới ngầm tội phạm. Lấy biệt hiệu The Punisher với biểu tượng đầu lâu trắng trên ngực, anh sử dụng mọi kỹ năng quân sự, vũ khí sát thương và phương thức tàn bạo nhất để tiêu diệt tận gốc tội ác.',
    powers: 'Bậc thầy chiến thuật quân sự và Du kích, Thiện xạ cự phách với mọi loại súng đạn, Chuyên gia cận chiến tay đôi và Chất nổ, Ý chí sắt đá chịu đựng mọi tra tấn đau đớn, Khả năng lập kế hoạch tác chiến thiên tài.'
  },
  'marvel/characters/black-panther-reading-order/index.html': {
    bio: 'T\'Challa là vị vua của Wakanda – một quốc gia châu Phi bí ẩn sở hữu nền công nghệ vượt bậc nhờ trữ lượng kim loại Vibranium quý hiếm. Bằng cách vượt qua các nghi lễ thử thách truyền thống và tiêu thụ Tâm hình thảo (Heart-Shaped Herb), anh nhận được sự bảo hộ của Nữ thần Báo Bast cùng danh hiệu Black Panther. T\'Challa vừa là một vị minh quân tận tụy bảo vệ vương quốc của mình, vừa là một siêu anh hùng toàn cầu sát cánh cùng biệt đội Avengers.',
    powers: 'Thể chất con người ở mức siêu việt (nhờ Tâm hình thảo), Giác quan sắc bén, Bậc thầy võ thuật và Nhào lộn Wakanda, Trí tuệ thiên tài về khoa học và Lãnh đạo, Bộ giáp Black Panther bện từ sợi kim loại Vibranium hấp thụ xung lực.'
  },
  'marvel/characters/moon-knight-reading-order/index.html': {
    bio: 'Marc Spector là một cựu lính đánh thuê bị bỏ lại cho đến chết dưới chân bức tượng của vị thần mặt trăng Ai Cập Khonshu. Được Khonshu hồi sinh để làm "Nắm đấm Báo thù" của ngài, Marc trở lại New York và khoác lên mình danh xưng Moon Knight. Mắc chứng rối loạn nhận dạng phân ly (DID) với nhiều nhân cách cùng tồn tại (Marc Spector, Steven Grant, Jake Lockley), Moon Knight là một hiệp sĩ bóng đêm phức tạp, chiến đấu chống tội phạm dưới ánh trăng huyền ảo.',
    powers: 'Thể lực và Khả năng chịu đau đớn phi thường, Sức mạnh gia tăng dưới ánh trăng tròn, Bậc thầy võ thuật và Thiện xạ vũ khí cổ truyền Ai Cập (lưỡi phi tiêu lưỡi liềm, gậy), Sở hữu nguồn tài chính khổng lồ (Steven Grant).'
  },
  'marvel/characters/miles-morales-reading-order/index.html': {
    bio: 'Miles Morales là một thiếu niên người Mỹ gốc Phi/Puerto Rico sinh sống tại Brooklyn. Sau khi vô tình bị cắn bởi một chú nhện biến đổi gen từ tập đoàn Oscorp, Miles phát hiện mình sở hữu những siêu năng lực tương tự Spider-Man, cùng những khả năng độc nhất vô nhị như cú đòn điện Venom Strike và tàng hình. Sau sự hy sinh của Peter Parker trong vũ trụ Ultimate (Earth-1610), Miles đã dũng cảm bước lên tiếp nối di sản Người Nhện và chứng minh bản thân là một Spider-Man thực thụ.',
    powers: 'Bám tường, Siêu sức mạnh, Tốc độ, Phản xạ và Giác quan nhện, Đòn phóng điện năng lượng sinh học (Venom Blast/Strike), Khả năng ngụy trang tàng hình (Camouflage).'
  },
  'marvel/characters/x-men-reading-order/index.html': {
    bio: 'X-Men là một nhóm các dị nhân (mutants) sở hữu gen X đột biến mang lại cho họ những năng lực phi thường bẩm sinh. Được sáng lập bởi Giáo sư Charles Xavier (Professor X), họ được đào tạo tại Học viện dành cho Thanh thiếu niên có Năng khiếu của Xavier nhằm học cách làm chủ năng lực của mình. Với lý tưởng cao đẹp về một thế giới nơi con người và dị nhân có thể chung sống hòa bình, X-Men chiến đấu để bảo vệ chính những con người luôn sợ hãi và thù ghét họ.',
    powers: 'Tập hợp các dị nhân với đa dạng siêu năng lực: Ngoại cảm, Thao túng thời tiết, Khả năng hồi phục, Thao túng từ trường, Bắn tia năng lượng quang học, Biến đổi vật chất.'
  },

  // ==========================================
  // 2. DC CHARACTERS
  // ==========================================
  'dc/characters/batman-reading-order/index.html': {
    bio: 'Batman là hiệp sĩ bóng đêm bảo vệ thành phố Gotham, người khoác lên mình hình tượng loài dơi để chiến đấu chống lại cái ác và gieo rắc nỗi sợ hãi vào tâm can của những kẻ tội phạm. Đằng sau lớp mặt nạ, anh là Bruce Wayne – tỷ phú kiêm nhà từ thiện của tập đoàn Wayne Enterprises. Tận mắt chứng kiến cha mẹ bị sát hại dã man trong con hẻm Crime Alley khi còn nhỏ, Bruce đã thề cống hiến trọn đời để diệt trừ tội ác thông qua việc trui rèn bản thân đạt đến đỉnh cao tuyệt đối về cả thể chất lẫn trí tuệ.',
    powers: 'Ý chí bất khuất, Thể lực đỉnh cao con người, Bậc thầy võ thuật, Nhào lộn và Thiện xạ, Chuyên gia thẩm vấn, Thám tử vĩ đại nhất thế giới, Bậc thầy cải trang, Bậc thầy chiến thuật.'
  },
  'dc/characters/superman-reading-order/index.html': {
    bio: 'Được gửi đến Trái Đất từ hành tinh Krypton trước bờ vực hủy diệt khi còn là một đứa trẻ sơ sinh, Kal-El được cặp vợ chồng nông dân nhân hậu Jonathan và Martha Kent nhận nuôi tại thị trấn Smallville dưới cái tên Clark Kent. Hấp thụ bức xạ từ mặt trời vàng của Trái Đất, anh sở hữu những sức mạnh thần thánh phi thường. Khi trưởng thành, Clark chuyển đến thành phố Metropolis, trở thành phóng viên của tòa soạn Daily Planet và là Superman – biểu tượng của chân lý, công lý và niềm hy vọng cho toàn nhân loại.',
    powers: 'Siêu sức mạnh vô song, Khả năng bay lượn, Bất khả xâm phạm, Tốc độ siêu thanh, Tia nhiệt từ mắt (Heat Vision), Hơi thở băng giá, Thính giác và Thị giác siêu phàm.'
  },
  'dc/characters/the-flash-reading-order/index.html': {
    bio: 'Barry Allen là một nhà khoa học pháp y tận tụy của Sở Cảnh sát Thành phố Central. Một đêm nọ, một tia sét đánh trúng phòng thí nghiệm làm đổ hàng loạt hóa chất lên người anh, ban cho anh khả năng kết nối trực tiếp với Speed Force – nguồn năng lượng vũ trụ tạo ra mọi chuyển động trong thời gian và không gian. Trở thành The Flash – "Người Đàn Ông Nhanh Nhất Hành Tinh", Barry bảo vệ Central City và sử dụng siêu tốc độ để chiến đấu vì công lý.',
    powers: 'Siêu tốc độ tiệm cận ánh sáng, Thao túng năng lượng Speed Force, Khả năng rung phân tử xuyên qua vật thể rắn, Du hành xuyên thời gian và Đa vũ trụ, Tự chữa lành siêu tốc.'
  },
  'dc/characters/wonder-woman-reading-order/index.html': {
    bio: 'Công chúa Diana của Themyscira là một nữ chiến binh Amazon bất tử được ban phước bởi các vị thần đỉnh Olympus cổ đại. Sinh ra trên hòn đảo Thiên Đường tách biệt với thế giới bên ngoài, Diana được chọn làm sứ giả hòa bình đại diện cho xứ sở Amazon đến với thế giới loài người. Khoác lên mình chiếc Thòng lọng Sự thật (Lasso of Truth) và Đôi vòng tay Bất hoại (Bracelets of Submission), Wonder Woman chiến đấu vì tình yêu, hòa bình và bình đẳng cho muôn loài.',
    powers: 'Siêu sức mạnh và Bất khả xâm phạm cấp Thần thánh, Khả năng bay lượn, Tốc độ và Phản xạ phi thường, Bậc thầy cận chiến và Kiếm thuật Amazon, Thòng lọng Sự thật ép buộc nói thật.'
  },
  'dc/characters/green-lantern-reading-order/index.html': {
    bio: 'Hal Jordan là một phi công thử nghiệm quả cảm và không hề biết sợ hãi. Khi người ngoài hành tinh Abin Sur của Quân đoàn Green Lantern Corps rơi xuống Trái Đất, chiếc nhẫn quyền năng của ông đã chọn Hal làm người kế thừa xứng đáng nhờ ý chí kiên định phi thường. Với tư cách là Green Lantern bảo vệ khu vực Không gian 2814, Hal Jordan có thể biến mọi ý tưởng trong trí tưởng tượng thành các cấu trúc năng lượng ánh sáng xanh lục hùng mạnh.',
    powers: 'Nhẫn quyền năng Green Lantern: Tạo các cấu trúc năng lượng ánh sáng cứng (Hard-light Constructs) theo ý chí, Khả năng bay lượn trong vũ trụ, Khiên bảo hộ trường lực, Du hành liên sao.'
  },
  'dc/characters/dick-grayson-reading-order/index.html': {
    bio: 'Dick Grayson từng là thành viên trẻ nhất của gia đình nghệ sĩ xiếc nhào lộn "The Flying Graysons". Sau khi cha mẹ anh bị một tên trùm tội phạm sát hại, Bruce Wayne đã nhận nuôi anh và đào tạo anh trở thành Robin – người đồng hành đầu tiên của Batman. Khi trưởng thành, Dick rời khỏi cái bóng của Người Dơi để tự khẳng định bản thân dưới danh xưng Nightwing, lãnh đạo nhóm Teen Titans và trở thành biểu tượng anh hùng đầy hy vọng bảo vệ thành phố Blüdhaven.',
    powers: 'Bậc thầy nhào lộn và Đu dây số một thế giới, Kỹ năng cận chiến đỉnh cao, Bậc thầy vũ khí cận chiến (Gậy Escrima), Trí tuệ chiến thuật và Phẩm chất lãnh đạo xuất chúng.'
  },
  'dc/characters/jason-todd-reading-order/index.html': {
    bio: 'Jason Todd là một đứa trẻ mồ côi đường phố ở Gotham được Batman bắt gặp khi đang cố ăn trộm lốp xe Batmobile và sau đó trở thành Robin thứ hai. Tuy nhiên, trong một cái bẫy tàn khốc, Jason đã bị The Joker đánh đập dã man và sát hại. Được hồi sinh qua giếng hồi sinh Lazarus Pit, Jason trở lại với danh xưng Red Hood – một phản anh hùng gai góc sẵn sàng sử dụng vũ lực gây chết người và súng đạn để trừng trị những kẻ tội phạm mà Batman tha mạng.',
    powers: 'Kỹ năng cận chiến tay đôi tàn bạo, Bậc thầy sử dụng mọi loại súng đạn và Chất nổ, Khả năng chịu đau phi thường nhờ hồi sinh từ Lazarus Pit, Kỹ năng thám tử và Tàng hình được huấn luyện bởi Batman.'
  },
  'dc/characters/joker-reading-order/index.html': {
    bio: 'The Joker là "Hoàng tử Hề Tội Phạm" (Clown Prince of Crime), kẻ thù truyền kiếp vĩ đại và nguy hiểm nhất của Batman. Danh tính và nguồn gốc thực sự của hắn vẫn chìm trong bí ẩn, ngoài chi tiết hắn rơi vào một bồn chứa hóa chất khiến làn da bị tẩy trắng, tóc chuyển sang màu xanh lá và tâm trí bị đẩy vào trạng thái điên loạn tột cùng. Joker coi tội ác như một trò đùa nghệ thuật, tôn thờ sự hỗn loạn và không ngừng tìm cách chứng minh rằng bất kỳ ai cũng có thể trở nên điên loạn chỉ sau "một ngày tồi tệ".',
    powers: 'Trí tuệ thiên tài về Hóa học (Chế tạo Độc dược Cười Joker Venom), Tâm lý hoàn toàn khó đoán và Miễn nhiễm với sự thao túng, Khả năng chịu đau cao, Kỹ năng chiến đấu cận chiến tàn bạo bất ngờ.'
  },
  'dc/characters/aquaman-reading-order/index.html': {
    bio: 'Arthur Curry là con trai của một người gác hải đăng trần thế và Nữ hoàng Atlanna của vương quốc Atlantis dưới đáy đại dương. Mang trong mình hai dòng máu, anh là chiếc cầu nối giữa thế giới mặt đất và đại dương sâu thẳm. Với tư cách là Vua của Atlantis, Aquaman sở hữu sức mạnh phi thường thích nghi với áp suất đáy biển, cầm trên tay Cây Đinh Ba của Poseidon quyền năng và có khả năng giao tiếp ngoại cảm chỉ huy mọi sinh vật biển trên toàn thế giới.',
    powers: 'Thần giao cách cảm điều khiển sinh vật biển, Siêu sức mạnh, Tốc độ bơi siêu thanh dưới nước, Sức bền chịu đựng áp suất biển sâu, Cây Đinh Ba quyền năng điều khiển nước và sét.'
  },
  'dc/characters/harley-quinn-reading-order/index.html': {
    bio: 'Tiến sĩ Harleen Quinzel từng là một bác sĩ tâm thần triển vọng tại Viện tâm thần Arkham Asylum. Tuy nhiên, sau khi nhận nhiệm vụ điều trị cho The Joker, cô đã bị hắn thao túng tâm lý và đem lòng yêu hắn say đắm. Giúp Joker vượt ngục, cô lấy danh xưng Harley Quinn, trở thành người đồng lõa cuồng nhiệt của hắn. Sau nhiều năm bị lạm dụng, Harley đã dũng cảm chia tay Joker, tự giải phóng bản thân và trở thành một phản anh hùng độc lập đầy tự do, quậy phá và đáng yêu.',
    powers: 'Kỹ năng nhào lộn và Thể dục dụng cụ đỉnh cao, Chuyên gia tâm lý học, Sử dụng thành thạo búa khổng lồ Mallet và Súng đạn, Miễn nhiễm với nhiều loại độc tố (nhờ Poison Ivy).'
  },
  'dc/characters/john-constantine-reading-order/index.html': {
    bio: 'John Constantine là một pháp sư đường phố, thám tử huyền bí và kẻ lừa đảo lành nghề người Anh. Khoác lên mình chiếc áo măng tô màu be quen thuộc cùng điếu thuốc Silk Cut trên môi, Constantine bảo vệ thế giới khỏi những thế lực ma quỷ, ác thần và lời nguyền cổ xưa. Không sở hữu sức mạnh phép thuật hủy diệt hoành tráng, vũ khí nguy hiểm nhất của John chính là sự giảo hoạt, khả năng thao túng tâm lý và những mưu mẹo siêu hạng khiến cả thiên thần lẫn ác quỷ đều phải dè chừng.',
    powers: 'Phép thuật huyền bí và Trừ tà cổ truyền, Khả năng đồng bộ hóa may mắn (Synchronicity Wave Travelling), Bậc thầy thao túng tâm lý và Lừa bịp, Trí tuệ thám tử huyền bí siêu đẳng.'
  },
  'dc/characters/teen-titans-reading-order/index.html': {
    bio: 'Teen Titans là nhóm siêu anh hùng thanh thiếu niên huyền thoại của DC Comics, ban đầu được thành lập bởi những cộng sự trẻ tuổi của Justice League (Robin, Kid Flash, Aqualad, Wonder Girl). Trải qua nhiều thế hệ – đặc biệt là kỷ nguyên "New Teen Titans" với sự gia nhập của Starfire, Raven, Cyborg và Beast Boy – nhóm đã trở thành một mái ấm gia đình thực sự của những người hùng trẻ tuổi, cùng nhau chống lại những hiểm họa đe dọa vũ trụ.',
    powers: 'Sự kết hợp đa dạng của các người hùng trẻ tuổi: Kỹ năng chiến đấu của Robin, Ma thuật bóng tối của Raven, Công nghệ cơ khí của Cyborg, Biến hình động vật của Beast Boy, Năng lượng người ngoài hành tinh của Starfire.'
  },
  'dc/characters/justice-league-reading-order/index.html': {
    bio: 'Justice League of America (JLA) là liên minh siêu anh hùng vĩ đại nhất của Vũ trụ DC, tập hợp những người bảo vệ hùng mạnh nhất của Trái Đất (Superman, Batman, Wonder Woman, The Flash, Green Lantern, Aquaman, Martian Manhunter). Hoạt động từ Tháp canh Watchtower ngoài quỹ đạo Trái Đất, Justice League là tuyến phòng thủ đầu tiên và kiên cố nhất của nhân loại trước những hiểm họa mang quy mô hủy diệt toàn vũ trụ.',
    powers: 'Liên minh tối thượng tập hợp các vị thần hiện đại: Siêu sức mạnh, Siêu tốc độ, Ma thuật, Công nghệ cao, Trí tuệ chiến thuật và Quyền năng vũ trụ.'
  },
  'dc/characters/deathstroke-reading-order/index.html': {
    bio: 'Slade Wilson là một cựu đại tá quân đội tinh nhuệ đã tình nguyện tham gia vào một cuộc thử nghiệm cường hóa quân sự. Thí nghiệm đã tăng cường tiềm năng não bộ của ông lên đến 90%, mang lại thể chất siêu nhân và khả năng tư duy chiến thuật vượt trội gấp nhiều lần người bình thường. Hoạt động dưới mật danh Deathstroke the Terminator, ông là tay lính đánh thuê và sát thủ nguy hiểm nhất thế giới, kẻ thù truyền kiếp của Teen Titans và Batman.',
    powers: 'Sử dụng 90% dung lượng não bộ, Phản xạ và Thể lực siêu nhân, Khả năng tự chữa lành, Bậc thầy võ thuật và Kiếm thuật cận chiến, Bậc thầy thiện xạ và Chiến thuật gia quân sự đỉnh cao.'
  },

  // ==========================================
  // 3. TOP MARVEL & DC EVENTS
  // ==========================================
  'marvel/events/civil-war-reading-order/index.html': {
    bio: 'Sau thảm kịch kinh hoàng tại Stamford gây ra bởi các siêu anh hùng trẻ tuổi khiến hàng trăm thường dân thiệt mạng, chính phủ Mỹ đã thông qua Đạo luật Đăng ký Siêu anh hùng (Superhero Registration Act) nhằm buộc tất cả những người có siêu năng lực phải công khai danh tính và hoạt động dưới quyền kiểm soát của chính quyền. Sự kiện này đã châm ngòi cho một cuộc nội chiến đẫm máu chia rẽ hoàn toàn cộng đồng siêu anh hùng: phe ủng hộ đạo luật do Iron Man dẫn đầu và phe phản đối kiên quyết bảo vệ tự do do Captain America lãnh đạo.'
  },
  'marvel/events/infinity-gauntlet-reading-order/index.html': {
    bio: 'Mad Titan Thanos đã thu thập đủ 6 Viên đá Vô cực (Infinity Gems) và gắn chúng vào chiếc Găng tay Vô cực quyền năng, đạt tới cảnh giới toàn năng ngang hàng với các vị thần vũ trụ. Nhằm làm vui lòng người tình trong mộng của hắn là hiện thân của Cái Chết (Mistress Death), Thanos đã chỉ bằng một cú búng tay xóa sổ một nửa số sinh linh trong toàn vũ trụ. Những người hùng sống sót còn lại của Trái Đất, dưới sự chỉ huy của Adam Warlock, phải bước vào một trận chiến tuyệt vọng để giành lại vận mệnh của vũ trụ.'
  },
  'marvel/events/secret-wars-2015-reading-order/index.html': {
    bio: 'Các hiện tượng va chạm đa vũ trụ (Incursions) khủng khiếp đã liên tiếp tiêu diệt các thực tại song song. Bất chấp mọi nỗ lực của các siêu anh hùng, Vũ trụ Marvel chính (Earth-616) và Vũ trụ Ultimate (Earth-1610) cuối cùng đã va chạm vào nhau, hủy diệt hoàn toàn Đa vũ trụ. Từ đống tro tàn, Doctor Doom bằng cách nào đó đã đoạt lấy quyền năng của các Beyonder để tạo ra Battleworld – một thế giới chắp vá duy nhất nơi hắn cai trị như một vị chúa trời toàn năng mang danh "God Emperor Doom".'
  },
  'marvel/events/house-of-m-reading-order/index.html': {
    bio: 'Sau khi Scarlet Witch (Wanda Maximoff) rơi vào trạng thái suy sụp tâm lý nghiêm trọng và giải phóng sức mạnh ma thuật thao túng thực tại, thế giới đã bị tái định hình hoàn toàn. Trong thực tại mới mang tên "House of M", loài dị nhân (mutants) trở thành tầng lớp thống trị dưới sự cai trị của Magneto và hoàng tộc của ông, trong khi con người bình thường là thiểu số bị áp bức. Khi các siêu anh hùng dần nhớ lại ký ức thực sự của mình, một trận chiến giải phóng thực tại nổ ra dẫn đến câu thần chú chấn động lịch sử: "No more mutants".'
  },
  'marvel/events/avengers-vs-x-men-reading-order/index.html': {
    bio: 'Thực thể vũ trụ Phoenix Force hủy diệt đang quay trở lại Trái Đất để tìm kiếm vật chủ mới – thiếu nữ dị nhân Hope Summers. Trong khi X-Men (dẫn đầu bởi Cyclops) tin rằng Phoenix Force là chiếc chìa khóa duy nhất để hồi sinh giống loài dị nhân đang bên bờ tuyệt chủng, thì Avengers (dẫn đầu bởi Captain America) lại coi đây là một hiểm họa diệt vong toàn cầu cần phải bị ngăn chặn bằng mọi giá. Xung đột tư tưởng này đã châm ngòi cho một cuộc đại chiến khốc liệt chưa từng có giữa hai liên minh vĩ đại nhất Trái Đất.'
  },
  'marvel/events/age-of-apocalypse-reading-order/index.html': {
    bio: 'Legion – người con trai dị nhân sở hữu đa nhân cách của Giáo sư Charles Xavier – đã du hành ngược thời gian với ý định ám sát Magneto nhưng lại vô tình giết chết chính cha mình khi Xavier lao ra đỡ đòn. Sự kiện nghịch lý thời gian này đã thay đổi hoàn toàn lịch sử: Apocalypse thức tỉnh sớm hơn và chinh phục toàn bộ Bắc Mỹ, biến Trái Đất thành một cơn ác mộng nơi chỉ có kẻ mạnh mới có quyền sống sót. Trong thế giới tăm tối này, Magneto chính là người thành lập và dẫn dắt các X-Men kiên cường kháng chiến.'
  },
  'marvel/events/annihilation-reading-order/index.html': {
    bio: 'Từ vùng không gian Vùng Tiêu Cực (Negative Zone), lãnh chúa tàn bạo Annihilus đã giải phóng làn sóng hủy diệt Annihilation Wave khổng lồ tràn vào vũ trụ thực, càn quét và tàn sát hàng tỷ hành tinh. Trước mối hiểm họa diệt vong mang tầm vóc vũ trụ này, Nova (Richard Rider), Star-Lord, Drax, Silver Surfer và Super-Skrull đã hợp lực tạo nên liên minh "United Front" trong một cuộc chiến sinh tử tuyệt vọng để cứu lấy toàn bộ vũ trụ.'
  },
  'dc/events/crisis-on-infinite-earths-reading-order/index.html': {
    bio: 'Một thực thể hủy diệt cổ xưa mang tên Anti-Monitor bắt đầu giải phóng làn sóng phản vật chất quét sạch vô số vũ trụ song song trên khắp Đa vũ trụ DC. Để ngăn chặn thảm họa diệt vong này, Monitor đã tập hợp các siêu anh hùng và ác nhân vĩ đại nhất từ các Trái Đất còn lại. Cuộc đại chiến định mệnh này không chỉ chứng kiến sự hy sinh bất tử của những người hùng như Barry Allen và Supergirl, mà còn hợp nhất toàn bộ Đa vũ trụ DC thành một dòng thời gian duy nhất.'
  },
  'dc/events/flashpoint-reading-order/index.html': {
    bio: 'Khi Barry Allen (The Flash) thức tỉnh tại bàn làm việc của mình, anh bàng hoàng nhận ra thế giới đã hoàn toàn đảo lộn: mẹ anh vẫn còn sống, nhưng anh không còn siêu tốc độ; Justice League chưa từng tồn tại; Batman trong dòng thời gian này chính là Thomas Wayne mang phong cách tàn bạo; trong khi đó, Wonder Woman và Aquaman đang dẫn dắt Themyscira và Atlantis vào một cuộc chiến tranh hủy diệt Trái Đất. Barry buộc phải tìm cách lấy lại sức mạnh để khôi phục dòng thời gian trước khi toàn bộ thực tại bị xóa sổ.'
  },
  'dc/events/blackest-night-reading-order/index.html': {
    bio: 'Lời tiên tri cổ xưa về "Đêm Đen Tối Nhất" (The Blackest Night) đã chính thức ứng nghiệm khi Nekron – chúa tể cõi chết – giải phóng những chiếc nhẫn quyền năng Đen (Black Lantern Rings) trên khắp vũ trụ. Những chiếc nhẫn này đã hồi sinh thi thể của hàng triệu người thân và các siêu anh hùng đã khuất thành những thây ma Black Lanterns vô cảm nhằm hút cạn mọi cảm xúc sống. Để cứu lấy sự sống của toàn vũ trụ, các quân đoàn thuộc phổ quang cảm xúc (Green, Red, Blue, Yellow, Orange, Indigo, Violet) buộc phải tạm gác lại thù hận để liên minh cùng nhau.'
  },
  'dc/events/dark-nights-metal-reading-order/index.html': {
    bio: 'Batman tình cờ phát hiện ra một bí mật cổ xưa về Đa vũ trụ Tối (Dark Multiverse) – một cõi ác mộng nằm bên dưới Đa vũ trụ DC nơi sinh ra từ những nỗi sợ hãi tồi tệ nhất. Một vị thần dơi hắc ám cổ xưa mang tên Barbatos đã xâm lược Trái Đất, dẫn theo "Các Hiệp Sĩ Bóng Đêm" (The Dark Knights) – những phiên bản Batman tha hóa và quái dị từ Đa vũ trụ Tối, đứng đầu là The Batman Who Laughs. Justice League phải săn tìm các kim loại huyền bí để chống lại thế lực bóng tối bao trùm.'
  },
  'dc/events/infinite-crisis-reading-order/index.html': {
    bio: 'Hai mươi năm sau thảm họa Crisis on Infinite Earths, niềm tin và sự đoàn kết giữa bộ ba trụ cột của Justice League (Superman, Batman, Wonder Woman) đã hoàn toàn rạn nứt. Nhận thấy Trái Đất hiện tại đã trở nên tha hóa và tăm tối, Alexander Luthor Jr. của Earth-3 và Superboy-Prime đã phá vỡ ranh giới thiên đường bỏ túi nhằm tái tạo lại Đa vũ trụ và tìm kiếm một "Trái Đất hoàn hảo", châm ngòi cho một cuộc khủng hoảng quy mô vĩ đại.'
  },
  'dc/events/final-crisis-reading-order/index.html': {
    bio: 'Vị thần tàn bạo Darkseid của hành tinh Apokolips đã rơi xuống Trái Đất sau cuộc chiến của các Tân Thần. Giải phóng Phương trình Phản Sinh Mệnh (Anti-Life Equation), Darkseid đã tước đoạt hoàn toàn ý chí tự do của nhân loại, biến loài người thành những nô lệ phục tùng ý chí của hắn. Đứng trước sự suy tàn của thực tại và sự sụp đổ của cái thiện, các siêu anh hùng của Justice League phải dấn thân vào trận chiến sinh tử cuối cùng nơi ranh giới giữa sự sống và cái chết hoàn toàn bị xóa nhòa.'
  },
  'dc/events/death-of-superman-reading-order/index.html': {
    bio: 'Một cỗ máy hủy diệt bí ẩn và không thể ngăn cản mang tên Doomsday bất ngờ trồi lên từ lòng đất và càn quét qua nước Mỹ, đánh bại toàn bộ các siêu anh hùng của Justice League một cách dễ dàng. Khi Doomsday tiến thẳng về thành phố Metropolis, chỉ còn duy nhất Superman đứng vững giữa con quái vật và hàng triệu sinh mạng vô tội. Trong trận chiến khốc liệt và bi tráng nhất lịch sử comics, Người Đàn Ông Thép đã chiến đấu đến hơi thở cuối cùng để bảo vệ thành phố anh yêu quý.'
  },

  // ==========================================
  // 4. TOP INDEPENDENT / OTHER COMICS
  // ==========================================
  'other/invincible-reading-order/index.html': {
    bio: 'Mark Grayson là con trai của Omni-Man – siêu anh hùng mạnh nhất Trái Đất đến từ chủng tộc Viltrumite ngoài hành tinh. Khi bước vào tuổi dậy thì, Mark bắt đầu bộc lộ siêu sức mạnh, khả năng bay lượn cùng sự bất hoại và lấy bí danh là Invincible để tiếp bước cha mình. Tuy nhiên, hành trình bảo vệ thế giới của cậu sớm phải đối mặt với những bi kịch tàn khốc, những trận chiến đẫm máu và bí mật đen tối đằng sau sứ mệnh thực sự của cha mình đối với Trái Đất.'
  },
  'other/the-boys-reading-order/index.html': {
    bio: 'Lấy bối cảnh trong một thế giới nơi các siêu anh hùng bị tha hóa bởi danh vọng, tiền tài và được bảo trợ bởi tập đoàn đa quốc gia Vought International. "The Boys" là một biệt đội đặc nhiệm ngầm do CIA bảo trợ, được dẫn dắt bởi Billy Butcher tàn nhẫn, chuyên đảm nhận nhiệm vụ theo dõi, răn đe và "xử lý" những siêu anh hùng biến chất vượt khỏi tầm kiểm soát.'
  },
  'other/watchmen-reading-order/index.html': {
    bio: 'Kiệt tác truyện tranh kinh điển của Alan Moore và Dave Gibbons lấy bối cảnh một dòng thời gian lịch sử thay thế trong thời kỳ Chiến tranh Lạnh. Sau vụ ám sát bí ẩn của cựu thành viên Minutemen mang tên The Comedian, thanh tra đeo mặt nạ Rorschach bắt đầu mở một cuộc điều tra để vạch trần âm mưu đen tối nhằm thanh trừng và định hình lại trật tự thế giới của các siêu anh hùng đã giải nghệ.'
  },
  'other/spawn-reading-order/index.html': {
    bio: 'Al Simmons là một đặc vụ ngầm cừu khôi của chính phủ Mỹ bị phản bội và sát hại dã man bởi chính cấp trên của mình. Linh hồn bị đày xuống Địa ngục, Al đã ký giao kèo với quỷ vương Malebolgia để được trở lại trần gian gặp lại người vợ yêu dấu. Trở về dưới hình hài Spawn – một Hellspawn mang trang phục sống cộng sinh sở hữu sức mạnh ma thuật Địa ngục, Al phải giằng xé giữa nhân tính sót lại và cuộc chiến giữa Thiên đường và Địa ngục.'
  },
  'other/hellboy-mignolaverse-reading-order/index.html': {
    bio: 'Hellboy là một sinh vật quỷ đỏ với chiếc sừng cưa ngắn và cánh tay phải bằng đá (Right Hand of Doom), được triệu hồi đến Trái Đất bởi các pháp sư huyền bí Đức Quốc Xã trong Thế chiến II. Được giáo sư Trevor Bruttenholm nhận nuôi và nuôi dạy như con người, Hellboy lớn lên trở thành đặc vụ hàng đầu của Cục Nghiên cứu và Phòng chống Huyền bí (B.P.R.D.), chuyên điều tra và chiến đấu chống lại các thế lực siêu nhiên hắc ám.'
  },
  'other/teenage-mutant-ninja-turtles-idw-reading-order/index.html': {
    bio: 'Bốn chú rùa đột biến ninja (Leonardo, Raphael, Donatello, Michelangelo) cùng người thầy chuột Splinter sinh sống tại cống ngầm thành phố New York. Dưới ngòi bút của IDW Publishing, vũ trụ TMNT được tái hiện một cách đen tối, sâu sắc và chặt chẽ hơn bao giờ hết, nơi tình anh em gia đình phải đối đầu với gia tộc ninja Chân Foot Clan của Shredder, lãnh chúa Krang và các thế lực dị biến ngoài không gian.'
  },
  'other/star-wars-marvel-reading-order/index.html': {
    bio: 'Khám phá thiên hà xa xôi qua lăng kính của Marvel Comics, bám sát các sự kiện diễn ra giữa A New Hope, The Empire Strikes Back và Return of the Jedi. Theo chân Luke Skywalker, Công chúa Leia, Han Solo, Chewbacca cùng Chúa tể bóng tối Darth Vader trong những chuyến phiêu lưu nghẹt thở định đoạt vận mệnh của toàn thiên hà.'
  },
  'other/star-wars-dark-horse-reading-order/index.html': {
    bio: 'Tuyển tập các bộ truyện tranh kinh điển thuộc Vũ trụ Mở rộng (Star Wars Expanded Universe / Legends) do Dark Horse Comics xuất bản trong suốt hơn hai thập kỷ. Bao quát lịch sử thiên hà từ thời kỳ Cộng hòa Cũ (Old Republic), Cuộc chiến Nhân bản (Clone Wars) cho đến di sản của dòng họ Skywalker hàng thế kỷ sau bộ ba phim gốc.'
  }
};

let updatedCount = 0;

for (const [relPath, data] of Object.entries(phase1Data)) {
  const absPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(absPath)) {
    console.warn('File not found:', relPath);
    continue;
  }

  let html = fs.readFileSync(absPath, 'utf8');

  // 1. Cập nhật Bio
  // Bio nằm trong thẻ <div class="x-text x-content ..."><p style="text-align: justify;">...</p></div>
  // hoặc <div class="x-text x-content ..."><p>...</p></div>
  const bioMatch = html.match(/(<div class="x-text x-content[^"]*">\s*<p[^>]*>)([\s\S]*?)(<\/p>\s*<\/div>)/);
  if (bioMatch) {
    const originalBio = bioMatch[2].trim();
    // Thay thế bio bằng tiếng Việt
    html = html.replace(bioMatch[0], `${bioMatch[1]}${data.bio}${bioMatch[3]}`);
  }

  // 2. Cập nhật Metadata labels
  html = html.replace(/<strong>First Appearance:<\/strong>/gi, '<strong>Xuất hiện lần đầu:</strong>');
  html = html.replace(/<strong>Creators:<\/strong>/gi, '<strong>Tác giả sáng tạo:</strong>');
  html = html.replace(/<strong>Powers:<\/strong>/gi, '<strong>Năng lực:</strong>');
  html = html.replace(/<strong>Teams:<\/strong>/gi, '<strong>Đội nhóm:</strong>');
  html = html.replace(/<strong>Aliases:<\/strong>/gi, '<strong>Bí danh:</strong>');
  html = html.replace(/<strong>Year Published:<\/strong>/gi, '<strong>Năm xuất bản:</strong>');
  html = html.replace(/<strong>Featured Characters:<\/strong>/gi, '<strong>Nhân vật nổi bật:</strong>');
  html = html.replace(/<strong>Previous Event:<\/strong>/gi, '<strong>Sự kiện trước:</strong>');
  html = html.replace(/<strong>Next Event:<\/strong>/gi, '<strong>Sự kiện tiếp theo:</strong>');
  html = html.replace(/<strong>Publisher:<\/strong>/gi, '<strong>Nhà xuất bản:</strong>');
  html = html.replace(/<strong>Publication Date:<\/strong>/gi, '<strong>Thời gian xuất bản:</strong>');
  html = html.replace(/<strong>Genre:<\/strong>/gi, '<strong>Thể loại:</strong>');

  // 3. Nếu có cập nhật Powers dịch riêng
  if (data.powers) {
    const powersRegex = /(<strong>Năng lực:<\/strong>\s*)([\s\S]*?)(<\/p>)/i;
    const pMatch = html.match(powersRegex);
    if (pMatch) {
      html = html.replace(powersRegex, `$1 ${data.powers}$3`);
    }
  }

  // 4. Cập nhật SEO Meta Description
  const shortBio = data.bio.length > 155 ? data.bio.substring(0, 152) + '...' : data.bio;
  html = html.replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${shortBio.replace(/"/g, '&quot;')}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${shortBio.replace(/"/g, '&quot;')}"`);

  fs.writeFileSync(absPath, html, 'utf8');
  updatedCount++;
  console.log(`[DONE] ${relPath}`);
}

console.log(`\nHoàn tất Giai đoạn 1: Đã việt hóa thành công ${updatedCount} trang tiêu biểu!`);
