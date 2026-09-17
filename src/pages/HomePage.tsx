import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Flame, Compass, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api, ReadingOrderItem } from '../services/api';
import { AdminQuickBar } from '../components/AdminQuickBar';

export const HomePage: React.FC = () => {
  const [readingOrders, setReadingOrders] = useState<ReadingOrderItem[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMasterNote, setShowMasterNote] = useState(false);

  const letters = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  useEffect(() => {
    fetchOrders(selectedLetter);
  }, [selectedLetter]);

  const fetchOrders = async (letter?: string) => {
    setLoading(true);
    try {
      const res = await api.getReadingOrders({ letter: letter || undefined });
      if (res.success) {
        setReadingOrders(res.data);
        if (res.available_letters) {
          setAvailableLetters(res.available_letters);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách thứ tự đọc:', err);
    } finally {
      setLoading(false);
    }
  };

  const marvelOrders = readingOrders.filter(o => o.universe_slug === 'marvel');
  const dcOrders = readingOrders.filter(o => o.universe_slug === 'dc');
  const otherOrders = readingOrders.filter(o => o.universe_slug === 'other');

  return (
    <>
      <AdminQuickBar />
      <div className="main-content">
        {/* Tiêu đề chính xác từ Comic Book Reading Orders _ Start Reading */}
        <h2 className="h-custom-headline cs-ta-center mts yellow-class h3 accent">
          <span><strong>Welcome to Comic Book Reading Orders!</strong></span>
        </h2>

        {/* Đoạn giới thiệu gốc Việt hóa chuẩn xác */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          padding: '16px 20px',
          marginBottom: '28px',
          fontSize: '15px',
          lineHeight: '1.8',
          textAlign: 'justify',
          color: '#333333'
        }}>
          <p style={{ margin: 0 }}>
            Mục tiêu của trang web này là trở thành nguồn tài nguyên thứ tự đọc truyện tranh phong phú nhất trên internet. Chúng tôi cung cấp thứ tự đọc chi tiết cho các nhân vật và sự kiện từ <strong><Link to="/universe/marvel" style={{ color: '#e42525', fontWeight: 700 }}>Marvel</Link></strong>, <strong><Link to="/universe/dc" style={{ color: '#0066aa', fontWeight: 700 }}>DC Comics</Link></strong> và các nhà xuất bản khác. Khi nhìn vào số lượng khổng lồ các đầu truyện tranh đã phát hành trong hơn 70 năm qua, việc không biết nên bắt đầu đọc từ đâu có thể khiến bạn bối rối. Chúng tôi hy vọng các thứ tự đọc được cung cấp trên trang web này sẽ giúp trải nghiệm đọc truyện của bạn trở nên dễ dàng, mạch lạc và thú vị nhất.
          </p>
        </div>

        {/* 4 Bộ đếm tổng quan chuẩn Tham Khảo (Counters) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          {/* Counter Marvel */}
          <div style={{
            border: '2px solid #e42525',
            borderRadius: '4px',
            padding: '16px 10px',
            backgroundColor: '#fff'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#e42525' }}>Marvel</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#e42525', margin: '4px 0' }}>
              279
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#888' }}>Thứ Tự Đọc</div>
          </div>

          {/* Counter DC */}
          <div style={{
            border: '2px solid #0066aa',
            borderRadius: '4px',
            padding: '16px 10px',
            backgroundColor: '#fff'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#0066aa' }}>DC Comics</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#0066aa', margin: '4px 0' }}>
              226
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#888' }}>Thứ Tự Đọc</div>
          </div>

          {/* Counter Khác (Other) */}
          <div style={{
            border: '2px solid #333333',
            borderRadius: '4px',
            padding: '16px 10px',
            backgroundColor: '#fff'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#333' }}>Khác (Other)</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#333', margin: '4px 0' }}>
              38
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#888' }}>Thứ Tự Đọc</div>
          </div>

          {/* Counter Tổng Cộng */}
          <div style={{
            border: '2px solid #00ac08',
            borderRadius: '4px',
            padding: '16px 10px',
            backgroundColor: '#fff'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', color: '#00ac08' }}>Tổng Cộng</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#00ac08', margin: '4px 0' }}>
              542
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#888' }}>Thứ Tự Đọc</div>
          </div>
        </div>

        {/* Khung Tin Tức & Cập Nhật Mới Nhất Viền Kép Đỏ Chuẩn Tham Khảo */}
        <div style={{
          border: '4px double #e42525',
          borderRadius: '4px',
          padding: '24px 28px',
          marginBottom: '32px',
          backgroundColor: '#fff'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px', color: '#111', textAlign: 'center' }}>
            Tin tức &amp; Các cập nhật mới nhất:
          </h4>
          <div style={{ fontSize: '14px', lineHeight: '1.9', textAlign: 'center', marginBottom: '12px' }}>
            <Link to="/universe/marvel" style={{ color: '#e42525', fontWeight: 700 }}>Alpha Flight</Link>,{' '}
            <Link to="/universe/dc" style={{ color: '#0066aa', fontWeight: 700 }}>Darkseid</Link>,{' '}
            <Link to="/universe/marvel" style={{ color: '#e42525', fontWeight: 700 }}>The Maker</Link>,{' '}
            <Link to="/universe/dc" style={{ color: '#0066aa', fontWeight: 700 }}>Huntress</Link>,{' '}
            <Link to="/universe/dc" style={{ color: '#0066aa', fontWeight: 700 }}>Onomatopoeia</Link>,{' '}
            <Link to="/universe/marvel" style={{ color: '#e42525', fontWeight: 700 }}>The Hood</Link>,{' '}
            <Link to="/universe/marvel" style={{ color: '#e42525', fontWeight: 700 }}>Ironheart</Link>
          </div>
          <div style={{ textAlign: 'center', marginBottom: '18px', fontSize: '13px' }}>
            <Link to="/updates" style={{ color: '#e42525', fontWeight: 700, textDecoration: 'underline' }}>
              Nhật Ký Cập Nhật (Reading Order Updates)
            </Link>{' '}
            - Cập nhật mới nhất ngày 15 tháng 9, 2026
          </div>

          {/* Thanh Tiến Độ Cập Nhật (Update Status Bars) */}
          <div style={{ marginTop: '16px' }}>
            <h6 className="h-skill-bar">Marvel Event Update Status</h6>
            <div className="x-skill-bar">
              <div className="bar" style={{ backgroundColor: '#e42525' }}>
                <div className="percent">X-Men: Age of Revelation</div>
              </div>
            </div>

            <h6 className="h-skill-bar">DC Event Update Status</h6>
            <div className="x-skill-bar">
              <div className="bar" style={{ backgroundColor: '#0066aa' }}>
                <div className="percent">DC K.O.</div>
              </div>
            </div>

            <h6 className="h-skill-bar">Marvel Character Update Status</h6>
            <div className="x-skill-bar">
              <div className="bar" style={{ backgroundColor: '#e42525' }}>
                <div className="percent">Tháng 3, 2026</div>
              </div>
            </div>

            <h6 className="h-skill-bar">DC Character Update Status</h6>
            <div className="x-skill-bar">
              <div className="bar" style={{ backgroundColor: '#0066aa' }}>
                <div className="percent">Tháng 6, 2026</div>
              </div>
            </div>
          </div>

          {/* Khối Góp Ý & Phản Hồi */}
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: '4px',
            fontSize: '13.5px',
            lineHeight: '1.6',
            color: '#475569',
            border: '1px solid #e2e8f0'
          }}>
            <strong style={{ color: '#0066aa' }}>Đóng góp ý kiến (Feedback Wanted):</strong> Chúng tôi luôn trân trọng mọi phản hồi về các bộ thứ tự đọc. Nếu bạn thấy thứ tự đọc nào cần tinh chỉnh hoặc bổ sung tập mới, hãy gửi tin nhắn cho chúng tôi tại trang{' '}
            <Link to="/contact" style={{ color: '#e42525', fontWeight: 700, textDecoration: 'underline' }}>
              Liên Hệ
            </Link>.
          </div>
        </div>

        {/* Khối Ghi Chú Master Orders (Accordion) Chuẩn Tham Khảo */}
        <div style={{
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          marginBottom: '32px',
          backgroundColor: '#ffffff',
          overflow: 'hidden'
        }}>
          <button
            type="button"
            onClick={() => setShowMasterNote(!showMasterNote)}
            style={{
              width: '100%',
              padding: '14px 20px',
              backgroundColor: '#f8fafc',
              border: 'none',
              borderBottom: showMasterNote ? '1px solid #e2e8f0' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              fontWeight: 700,
              color: '#334155',
              textAlign: 'left'
            }}
          >
            <span>📌 Lưu ý về các bộ Thứ tự đọc quy mô lớn (Master Orders, New 52, Marvel NOW!). Bấm vào đây để xem.</span>
            <span style={{ fontSize: '18px' }}>{showMasterNote ? '−' : '+'}</span>
          </button>
          {showMasterNote && (
            <div style={{ padding: '18px 24px', fontSize: '14px', lineHeight: '1.7', color: '#475569', textAlign: 'justify' }}>
              <p style={{ marginBottom: '10px' }}>
                Trên trang web có một số thứ tự đọc rất dài như Master Orders của Marvel và DC hay các kỷ nguyên Marvel NOW!, New 52 chứa hàng ngàn tập truyện. Bạn không cần phải cố gắng đọc hết toàn bộ. Nếu bạn là độc giả mới, chúng tôi khuyên bạn nên bắt đầu bằng thứ tự đọc của một nhân vật cụ thể hoặc một sự kiện giới hạn mà bạn yêu thích.
              </p>
              <p style={{ margin: 0 }}>
                Không có một cốt truyện duy nhất nào xuyên suốt toàn bộ các bộ truyện này, hãy coi chúng đơn giản là dòng lịch sử của vũ trụ truyện tranh. Bạn chỉ cần đọc những đầu truyện mà mình thấy hứng thú nhất.
              </p>
            </div>
          )}
        </div>

        {/* 3 Khối Giới Thiệu Phân Loại Chuẩn Tham Khảo (Event, Character, Master) */}
        <div style={{ marginBottom: '32px' }}>
          <h4 className="h-custom-headline yellow-class accent" style={{ fontSize: '16px' }}>
            <span>Event Reading Orders (Thứ Tự Đọc Theo Sự Kiện)</span>
          </h4>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', textAlign: 'justify', marginBottom: '24px' }}>
            Tất cả các phần ngoại truyện (tie-ins) cho từng sự kiện đều được liệt kê đầy đủ. Tuy nhiên, nếu bạn không muốn đọc quá dài, bạn hoàn toàn có thể chỉ tập trung vào series chính của sự kiện hoặc các tie-ins của nhân vật bạn yêu thích. Series chính thường là đã đủ để bạn nắm trọn vẹn toàn bộ diễn biến của sự kiện.
          </p>

          <h4 className="h-custom-headline yellow-class accent" style={{ fontSize: '16px' }}>
            <span>Character Reading Orders (Thứ Tự Đọc Theo Nhân Vật)</span>
          </h4>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', textAlign: 'justify', marginBottom: '24px' }}>
            Thứ tự đọc theo nhân vật được chọn lọc cẩn thận. Những nhân vật nổi tiếng có hàng nghìn tập truyện nhưng không phải tập nào cũng đáng đọc. Vì vậy danh sách của chúng tôi chỉ giữ lại những đầu truyện quan trọng nhất cho sự phát triển của nhân vật cùng các run truyện huyền thoại của các tác giả xuất sắc.
          </p>

          <h4 className="h-custom-headline yellow-class accent" style={{ fontSize: '16px' }}>
            <span>Master Reading Orders (Thứ Tự Đọc Toàn Diện Toàn Vũ Trụ)</span>
          </h4>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', textAlign: 'justify', marginBottom: '24px' }}>
            Master Reading Orders bao quát toàn bộ lịch sử của cả một vũ trụ truyện tranh từ thời kỳ khai sinh. Các đầu truyện được sắp xếp theo dòng thời gian biên niên sử mạch lạc giúp bạn có cái nhìn tổng thể nhất về các thời kỳ truyện tranh kinh điển.
          </p>
        </div>

        {/* Tiêu đề danh sách đầy đủ */}
        <h2 className="h-custom-headline dark-class accent">
          <span>DANH SÁCH THỨ TỰ ĐỌC (READING ORDERS)</span>
        </h2>

        {/* Thanh chỉ mục chữ cái A - Z */}
        <div className="letter-index-bar">
          <button
            className={`letter-btn ${selectedLetter === '' ? 'active' : ''}`}
            onClick={() => setSelectedLetter('')}
            style={{ width: 'auto', padding: '0 10px' }}
          >
            Tất cả
          </button>
          {letters.map(letter => {
            const isAvailable = availableLetters.length === 0 || availableLetters.includes(letter);
            return (
              <button
                key={letter}
                disabled={!isAvailable}
                className={`letter-btn ${selectedLetter === letter ? 'active' : ''}`}
                onClick={() => setSelectedLetter(letter)}
                style={{
                  opacity: isAvailable ? 1 : 0.25,
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  backgroundColor: selectedLetter === letter ? undefined : (isAvailable ? '#ffffff' : '#f8fafc')
                }}
                title={isAvailable ? `Xem thứ tự đọc bắt đầu bằng chữ ${letter}` : `Chưa có thứ tự đọc bắt đầu bằng chữ ${letter}`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* Danh sách các thẻ Reading Order */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Đang tải dữ liệu thứ tự đọc...
          </div>
        ) : readingOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Không tìm thấy thứ tự đọc nào bắt đầu bằng ký tự "{selectedLetter}".
          </div>
        ) : (
          <div className="reading-orders-grid">
            {readingOrders.map(order => {
              const isUpcoming = !order.issue_count || order.issue_count === 0;
              return (
                <Link
                  key={order.id}
                  to={`/reading-order/${order.slug}`}
                  className={`order-card ${isUpcoming ? 'is-upcoming' : ''}`}
                >
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: order.accent_color || '#e42525',
                      letterSpacing: '1px',
                      marginBottom: '4px'
                    }}>
                      {order.universe_name}
                    </div>
                    <h3 className="order-card-title">{order.title}</h3>
                    {order.featured_characters && (
                      <div className="order-card-chars">
                        <strong>Nhân vật:</strong> {order.featured_characters}
                      </div>
                    )}
                  </div>
                  <div className="order-card-footer">
                    <span>{order.year_published ? `Năm: ${order.year_published}` : 'Nhiều năm'}</span>
                    <span style={{
                      backgroundColor: isUpcoming ? '#f1f5f9' : '#f2f2f2',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      color: isUpcoming ? '#64748b' : '#333',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      {isUpcoming ? 'Sắp có' : `${order.issue_count} tập`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
