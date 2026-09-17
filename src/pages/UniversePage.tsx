import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, ReadingOrderItem } from '../services/api';
import { AdminQuickBar } from '../components/AdminQuickBar';

export const UniversePage: React.FC = () => {
  const { slug, category } = useParams<{ slug: string; category?: string }>();
  const [orders, setOrders] = useState<ReadingOrderItem[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [availableLetters, setAvailableLetters] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<'alphabetical' | 'timeline'>('alphabetical');
  const [loading, setLoading] = useState(true);

  const letters = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  const universeMeta: Record<string, { name: string; color: string; accentClass: string; desc: string }> = {
    marvel: {
      name: 'Marvel Comics',
      color: '#e42525',
      accentClass: 'red-class',
      desc: 'Chào mừng bạn đến với vũ trụ Marvel Comics. Nơi đây tổng hợp thứ tự đọc trọn vẹn của mọi đại sự kiện, nhân vật huyền thoại và vũ trụ thay thế như Marvel 2099.'
    },
    dc: {
      name: 'DC Comics',
      color: '#0066aa',
      accentClass: 'blue-class',
      desc: 'Khám phá Đa Vũ Trụ DC Comics qua các kỷ nguyên hoàng kim, từ kỷ nguyên Tiền Khủng Hoảng (Pre-Crisis), Khủng Hoảng Vô Hạn (Crisis on Infinite Earths) đến hiện đại.'
    },
    other: {
      name: 'Các Bộ Truyện Khác (Other Comics)',
      color: '#333333',
      accentClass: 'dark-class',
      desc: 'Thứ tự đọc chi tiết cho các tuyệt tác truyện tranh độc lập từ Dark Horse, Image Comics, IDW: Hellboy, The Boys, Invincible, TMNT...'
    }
  };

  const currentMeta = (slug && universeMeta[slug]) || universeMeta.marvel;
  const activeCategory = category || (slug === 'other' ? undefined : 'events');

  useEffect(() => {
    fetchData();
  }, [slug, category, selectedLetter, sortMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getReadingOrders({
        universe: slug,
        category: activeCategory,
        letter: sortMode === 'timeline' ? undefined : (selectedLetter || undefined),
        sort: sortMode === 'timeline' ? 'timeline' : undefined
      });
      if (res.success) {
        setOrders(res.data);
        if (res.available_letters) {
          setAvailableLetters(res.available_letters);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = slug === 'other'
    ? 'CÁC BỘ TRUYỆN KHÁC (OTHER)'
    : activeCategory === 'characters'
    ? `${currentMeta.name.toUpperCase()} - NHÂN VẬT (CHARACTERS)`
    : activeCategory === 'master'
    ? `${currentMeta.name.toUpperCase()} - THỨ TỰ ĐỌC MASTER`
    : `${currentMeta.name.toUpperCase()} - SỰ KIỆN (EVENTS)`;

  return (
    <>
      <AdminQuickBar />
      <div className="main-content">
        {/* Tiêu đề có gạch viền chuẩn Tham Khảo */}
        <h1 className={`h-custom-headline ${currentMeta.accentClass} accent`}>
          <span>{pageTitle}</span>
        </h1>

        {/* Mô tả giới thiệu */}
        <div style={{
          backgroundColor: '#fafafa',
          border: '1px solid #ededed',
          borderRadius: '4px',
          padding: '20px 24px',
          marginBottom: '24px',
          fontSize: '15px',
          lineHeight: '1.7',
          color: '#333333',
          textAlign: 'justify'
        }}>
          {currentMeta.desc}
        </div>

        {/* Tab lọc danh mục: Sự Kiện, Nhân Vật, và Master */}
        {slug !== 'other' && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '22px' }}>
            <Link
              to={`/universe/${slug}/events`}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: activeCategory === 'events' ? currentMeta.color : '#f0f0f0',
                color: activeCategory === 'events' ? '#ffffff' : '#444444',
                boxShadow: activeCategory === 'events' ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Sự Kiện (Events)
            </Link>
            <Link
              to={`/universe/${slug}/characters`}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: activeCategory === 'characters' ? currentMeta.color : '#f0f0f0',
                color: activeCategory === 'characters' ? '#ffffff' : '#444444',
                boxShadow: activeCategory === 'characters' ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Nhân Vật (Characters)
            </Link>
            <Link
              to={`/universe/${slug}/master`}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: activeCategory === 'master' ? currentMeta.color : '#f0f0f0',
                color: activeCategory === 'master' ? '#ffffff' : '#444444',
                boxShadow: activeCategory === 'master' ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              Thứ Tự Đọc Master
            </Link>
          </div>
        )}

        {/* Bộ lọc Dòng Thời Gian dành cho DC Events */}
        {slug === 'dc' && activeCategory === 'events' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px 18px',
            marginBottom: '18px'
          }}>
            <div style={{ fontSize: '13px', color: '#334155' }}>
              <strong>Chế độ xem sự kiện DC:</strong> Chuyển đổi giữa danh sách theo Bảng chữ cái hoặc Thứ tự thời gian liên tục.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { setSortMode('alphabetical'); setSelectedLetter(''); }}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '16px',
                  border: sortMode === 'alphabetical' ? '1px solid #0066aa' : '1px solid #cbd5e1',
                  backgroundColor: sortMode === 'alphabetical' ? '#0066aa' : '#ffffff',
                  color: sortMode === 'alphabetical' ? '#ffffff' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                A - Z (Bảng chữ cái)
              </button>
              <button
                type="button"
                onClick={() => { setSortMode('timeline'); setSelectedLetter(''); }}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '16px',
                  border: sortMode === 'timeline' ? '1px solid #0066aa' : '1px solid #cbd5e1',
                  backgroundColor: sortMode === 'timeline' ? '#0066aa' : '#ffffff',
                  color: sortMode === 'timeline' ? '#ffffff' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Dòng Thời Gian (DC Event Timeline)
              </button>
            </div>
          </div>
        )}

        {/* Chỉ mục ký tự A - Z */}
        {sortMode === 'alphabetical' && (
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
        )}

        {/* Danh sách các thẻ */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Đang tải dữ liệu...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Không có thứ tự đọc nào trong mục này.
          </div>
        ) : (
          <div className="reading-orders-grid">
            {orders.map(order => {
              const isUpcoming = !order.issue_count || order.issue_count === 0;
              return (
                <Link
                  key={order.id}
                  to={`/reading-order/${order.slug}`}
                  className={`order-card ${isUpcoming ? 'is-upcoming' : ''}`}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: currentMeta.color,
                        letterSpacing: '1px'
                      }}>
                        {order.category_name || order.universe_name}
                      </div>
                      {order.timeline_order && (
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          padding: '1px 7px',
                          borderRadius: '10px'
                        }}>
                          Timeline #{order.timeline_order}
                        </span>
                      )}
                    </div>
                    <h3 className="order-card-title">{order.title}</h3>
                    {order.featured_characters && (
                      <div className="order-card-chars">
                        <strong>Nhân vật:</strong> {order.featured_characters}
                      </div>
                    )}
                  </div>
                  <div className="order-card-footer">
                    <span>{order.year_published ? `Năm: ${order.year_published}` : ''}</span>
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
