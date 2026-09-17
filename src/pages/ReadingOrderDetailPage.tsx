import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Check, Edit2, Plus, Sparkles, BookOpen, ChevronRight, Lock, User, Info } from 'lucide-react';
import { api, ReadingOrderItem, IssueItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AdminQuickBar } from '../components/AdminQuickBar';

export const ReadingOrderDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [order, setOrder] = useState<ReadingOrderItem | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'tpb'>('single');
  const [readIssues, setReadIssues] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [editingIssue, setEditingIssue] = useState<IssueItem | null>(null);
  const [editReadUrl, setEditReadUrl] = useState('');
  const [savingIssue, setSavingIssue] = useState(false);

  const { isLoggedIn, isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    if (slug) {
      window.scrollTo(0, 0);
      loadDetail(slug);
    }
  }, [slug, isLoggedIn]);

  const loadDetail = async (orderSlug: string) => {
    setLoading(true);
    try {
      const res = await api.getReadingOrderDetail(orderSlug);
      if (res.success && res.data) {
        setOrder(res.data);
        if (isLoggedIn) {
          try {
            const prog = await api.auth.getProgress(res.data.id);
            if (prog.success && prog.data?.readIssueIds) {
              const map: Record<number, boolean> = {};
              prog.data.readIssueIds.forEach((id: number) => { map[id] = true; });
              setReadIssues(map);
            } else {
              setReadIssues({});
            }
          } catch (e) {
            console.error(e);
            setReadIssues({});
          }
        } else {
          // Chưa đăng nhập thì không nạp tiến độ
          setReadIssues({});
        }
      } else {
        setOrder(null);
      }
    } catch (err) {
      console.error(err);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleRead = async (issueId: number) => {
    if (!order) return;
    if (!isLoggedIn) {
      openAuthModal('login', 'Đăng Nhập Để Lưu Tiến Độ');
      return;
    }

    const currentStatus = !!readIssues[issueId];
    const updated = { ...readIssues, [issueId]: !currentStatus };
    setReadIssues(updated);

    try {
      await api.auth.toggleProgress(order.id, issueId);
    } catch (e) {
      console.error(e);
    }
  };

  const markAll = async (status: boolean) => {
    if (!order || !order.issues) return;
    if (!isLoggedIn) {
      openAuthModal('login', 'Đăng Nhập Để Dùng Tiến Độ');
      return;
    }

    const comicOnly = order.issues.filter(i => i.issue_type !== 'comment');
    const updated: Record<number, boolean> = {};
    if (status) {
      comicOnly.forEach(i => {
        updated[i.id] = true;
      });
    }
    setReadIssues(updated);

    try {
      const allIds = comicOnly.map(i => i.id);
      await api.auth.markAllProgress(order.id, status, allIds);
    } catch (e) {
      console.error(e);
    }
  };

  // Mở modal sửa nhanh link đọc của issue (dành cho Admin)
  const handleOpenEditLink = (issue: IssueItem) => {
    setEditingIssue(issue);
    setEditReadUrl(issue.read_url || '');
  };

  const handleSaveIssueLink = async () => {
    if (!editingIssue || !order) return;
    setSavingIssue(true);
    try {
      const res = await api.admin.updateIssue(editingIssue.id, {
        read_url: editReadUrl.trim()
      });
      if (res.success) {
        // Cập nhật state nội bộ
        setOrder({
          ...order,
          issues: order.issues?.map(i => i.id === editingIssue.id ? { ...i, read_url: editReadUrl.trim() } : i)
        });
        setEditingIssue(null);
      } else {
        alert(res.message || 'Lỗi khi cập nhật link');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể lưu link đọc');
    } finally {
      setSavingIssue(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#666' }}>Đang tải thứ tự đọc...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}>
        <h2>Không tìm thấy thứ tự đọc này.</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '20px' }}>Quay lại Trang Chủ</Link>
      </div>
    );
  }

  const allIssues = order.issues || [];
  const singleIssues = allIssues.filter(i => (i.tab_type || 'single') === 'single');
  const tpbIssues = allIssues.filter(i => i.tab_type === 'tpb');

  const singleComicIssues = singleIssues.filter(i => i.issue_type !== 'comment');
  const tpbComicIssues = tpbIssues.filter(i => i.issue_type !== 'comment');

  const issues = activeTab === 'single' ? singleIssues : tpbIssues;
  const comicIssues = activeTab === 'single' ? singleComicIssues : tpbComicIssues;
  const readCount = comicIssues.filter(i => readIssues[i.id]).length;
  const progressPercent = comicIssues.length > 0 ? Math.round((readCount / comicIssues.length) * 100) : 0;

  const renderCommentContent = (text: string) => {
    let processed = text;
    if (!processed.includes('[') && !processed.includes('](')) {
      processed = processed
        .replace(/at 2099\b/g, 'at [2099](/reading-order/2099)')
        .replace(/at Marvel 2099\b/g, 'at [Marvel 2099](/reading-order/marvel-2099)')
        .replace(/Marvel Zombies Reading Order/g, '[Marvel Zombies Reading Order](/reading-order/marvel-zombies)');
    }

    const mdRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | React.ReactNode)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mdRegex.exec(processed)) !== null) {
      if (match.index > lastIndex) {
        parts.push(processed.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];

      if (url.startsWith('/')) {
        parts.push(
          <Link
            key={match.index}
            to={url}
            style={{
              color: '#1d4ed8',
              fontWeight: 700,
              textDecoration: 'underline',
              textUnderlineOffset: '2px'
            }}
          >
            {label}
          </Link>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1d4ed8',
              fontWeight: 700,
              textDecoration: 'underline',
              textUnderlineOffset: '2px'
            }}
          >
            {label}
          </a>
        );
      }
      lastIndex = mdRegex.lastIndex;
    }

    if (lastIndex < processed.length) {
      parts.push(processed.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  const accentClass = order.universe_slug === 'dc' ? 'blue-class' : order.universe_slug === 'marvel' ? 'red-class' : 'dark-class';

  return (
    <>
      <AdminQuickBar currentOrderId={order.id} />
      <div className="main-content">
        {/* Breadcrumbs */}
        <div style={{ fontSize: '12px', color: '#777777', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link to="/">Trang Chủ</Link>
          <ChevronRight size={12} />
          <Link to={`/universe/${order.universe_slug}`}>{order.universe_name}</Link>
          {order.category_name && (
            <>
              <ChevronRight size={12} />
              <Link to={`/universe/${order.universe_slug}/${order.category_slug}`}>{order.category_name}</Link>
            </>
          )}
          <ChevronRight size={12} />
          <span style={{ color: '#222', fontWeight: 600 }}>{order.title}</span>
        </div>

        {/* Tiêu đề có gạch viền chuẩn Tham Khảo */}
        <h1 className={`h-custom-headline ${accentClass} accent`}>
          <span>{order.title}</span>
        </h1>

        {/* Khối thông tin 2 cột */}
        <div className="event-meta-grid">
          <div className="event-meta-desc">
            {order.description ? (
              <p>{order.description}</p>
            ) : (
              <p style={{ fontStyle: 'italic', color: '#777777', margin: 0 }}>
                Nội dung tóm tắt và thứ tự đọc chi tiết của sự kiện này đang được biên tập cập nhật.
              </p>
            )}
          </div>
          <div className="event-meta-info">
            <div><strong>Năm xuất bản</strong>: {order.year_published || 'Đang cập nhật'}</div>
            {order.featured_characters && (
              <div><strong>Nhân vật nổi bật</strong>: {order.featured_characters}</div>
            )}
            {order.previous_event_title && (
              <div>
                <strong>Sự kiện trước</strong>:{' '}
                {order.previous_event_slug ? (
                  <Link to={`/reading-order/${order.previous_event_slug}`}>{order.previous_event_title}</Link>
                ) : (
                  <span>{order.previous_event_title}</span>
                )}
              </div>
            )}
            {order.next_event_title && (
              <div>
                <strong>Sự kiện sau</strong>:{' '}
                {order.next_event_slug ? (
                  <Link to={`/reading-order/${order.next_event_slug}`}>{order.next_event_title}</Link>
                ) : (
                  <span>{order.next_event_title}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bộ đếm tập truyện (Counter Badge) */}
        <div className="x-counter-container">
          <div className={`x-counter-badge ${order.universe_slug === 'dc' ? 'dc-counter' : ''}`}>
            {allIssues.length > 0 ? (
              <>
                <span className="x-counter-number">
                  {comicIssues.length > 0
                    ? comicIssues.length
                    : singleIssues.filter(i => i.issue_type !== 'comment').length}
                </span>
                <span className="x-counter-label">
                  {activeTab === 'tpb' && tpbIssues.length > 0 ? 'TẬP TỔNG HỢP (TPBs)' : 'TẬP TRUYỆN (ISSUES)'}
                </span>
              </>
            ) : (
              <>
                <span className="x-counter-number" style={{ fontSize: '26px', color: '#e42525' }}>SẮP CÓ</span>
                <span className="x-counter-label">DANH SÁCH TẬP TRUYỆN</span>
              </>
            )}
          </div>
        </div>

        {allIssues.length === 0 ? (
          /* Trạng thái Sắp có khi chưa có danh sách tập truyện */
          <div style={{
            padding: '48px 24px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            border: '2px dashed #e2e8f0',
            borderRadius: '6px',
            margin: '24px 0'
          }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}>
              <BookOpen size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
              Danh Sách Tập Truyện Sắp Có
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '520px', margin: '0 auto 16px', lineHeight: '1.6' }}>
              Thứ tự đọc chi tiết cho sự kiện này hiện đang được biên tập và sẽ sớm có mặt.
            </p>
            {isAuthenticated && (
              <div style={{ marginTop: '14px' }}>
                <Link to={`/admin/reading-orders/${order.id}`} className="btn-primary" style={{ fontSize: '13px' }}>
                  <Plus size={14} /> Quản trị viên: Thêm tập truyện cho sự kiện này
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Chú giải phân loại màu sắc */}
            <div className="issue-legend">
              <div className="legend-item legend-ongoing">
                <span className="legend-dot"></span> Series Dài Kỳ (Ongoing)
              </div>
              <div className="legend-item legend-limited">
                <span className="legend-dot"></span> Series Giới Hạn (Limited)
              </div>
              <div className="legend-item legend-oneshot">
                <span className="legend-dot"></span> One-Shots
              </div>
              <div className="legend-item legend-comment">
                <span className="legend-dot"></span> Ghi Chú Đọc (Comments)
              </div>
            </div>

            {/* Tabs: Từng Tập vs Tập Tổng Hợp */}
            <div className="x-tabs-container">
              <ul className="x-tabs-nav">
                <li>
                  <button
                    className={`x-tab-btn ${activeTab === 'single' ? 'active' : ''}`}
                    onClick={() => setActiveTab('single')}
                  >
                    Từng Tập Truyện (Single Issues)
                    {singleComicIssues.length > 0 && (
                      <span style={{ marginLeft: '6px', fontSize: '12px', fontWeight: 600, opacity: 0.8 }}>
                        ({singleComicIssues.length})
                      </span>
                    )}
                  </button>
                </li>
                <li>
                  <button
                    className={`x-tab-btn ${activeTab === 'tpb' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tpb')}
                  >
                    Tập Tổng Hợp (TPBs)
                    {tpbComicIssues.length > 0 ? (
                      <span style={{ marginLeft: '6px', fontSize: '12px', fontWeight: 600, opacity: 0.8 }}>
                        ({tpbComicIssues.length})
                      </span>
                    ) : (
                      <span style={{ marginLeft: '6px', fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>
                        (0)
                      </span>
                    )}
                  </button>
                </li>
              </ul>

              {activeTab === 'tpb' && tpbComicIssues.length === 0 ? (
                <div style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  margin: '16px 0 32px'
                }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <BookOpen size={26} />
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                    Chưa Có Danh Sách Tập Tổng Hợp (TPBs)
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', maxWidth: '480px', margin: '0 auto 16px', lineHeight: '1.6' }}>
                    Thứ tự đọc này hiện chỉ có danh sách Từng Tập Truyện (Single Issues). Danh sách Tập Tổng Hợp (TPBs) sẽ được ban biên tập cập nhật thêm.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('single')}
                    className="btn-primary"
                    style={{ fontSize: '13px', padding: '8px 18px', cursor: 'pointer' }}
                  >
                    Xem Từng Tập Truyện ({singleComicIssues.length} tập)
                  </button>
                  {isAuthenticated && (
                    <div style={{ marginTop: '16px' }}>
                      <Link to={`/admin/reading-orders/${order.id}`} style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                        + Quản trị viên: Thêm tập TPB trong trang quản lý
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Thanh Tiến Độ Đọc Truyện */}
              {!isLoggedIn ? (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Lock size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        Chưa đăng nhập — Tiến độ đọc chưa kích hoạt
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Vui lòng đăng nhập tài khoản để đánh dấu các tập đã đọc và lưu tiến độ cá nhân.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login', 'Đăng Nhập Để Lưu Tiến Độ')}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 700,
                      backgroundColor: '#e42525',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <User size={14} />
                    <span>Đăng Nhập Ngay</span>
                  </button>
                </div>
              ) : (
                <div className="reading-progress-bar-wrap">
                  <div className="reading-progress-info">
                    <span>
                      Tiến độ đọc của bạn: <strong>{readCount}</strong> / {comicIssues.length} tập ({progressPercent}%)
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => markAll(true)}
                        style={{ background: 'none', border: 'none', color: '#0066aa', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Đánh dấu đã đọc tất cả
                      </button>
                      <span style={{ color: '#ccc' }}>|</span>
                      <button
                        onClick={() => markAll(false)}
                        style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                  <div className="reading-progress-track">
                    <div className="reading-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              )}

              {/* Danh sách tập truyện */}
              <div className="issues-list">
                {(() => {
                  let comicIndex = 0;
                  return issues.map((issue) => {
                    // Nếu là Comment (Ghi chú đọc): Hiển thị dưới dạng khung ghi chú chuyên biệt
                    if (issue.issue_type === 'comment') {
                      return (
                        <div
                          key={issue.id}
                          className="issue-comment-card"
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '14px 18px',
                            margin: '10px 0',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderLeft: '4px solid #2563eb',
                            borderRadius: '6px',
                            boxShadow: '0 1px 3px rgba(37, 99, 235, 0.05)'
                          }}
                        >
                          <div style={{ color: '#2563eb', marginTop: '2px', flexShrink: 0 }}>
                            <Info size={18} />
                          </div>
                          <div style={{ flex: 1, fontSize: '13.5px', color: '#1e3a8a', lineHeight: '1.6' }}>
                            <span style={{
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              fontSize: '11px',
                              letterSpacing: '0.6px',
                              color: '#2563eb',
                              display: 'block',
                              marginBottom: '2px'
                            }}>
                              Ghi Chú Đọc (Comment)
                            </span>
                            <div>{renderCommentContent(issue.title)}</div>
                            {issue.note && (
                              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                                {issue.note}
                              </div>
                            )}
                          </div>
                          {isAuthenticated && (
                            <button
                              onClick={() => handleOpenEditLink(issue)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                backgroundColor: '#222',
                                color: '#febd11',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              title="Admin: Sửa nội dung / link ghi chú"
                            >
                              <Edit2 size={11} />
                              <span>Sửa</span>
                            </button>
                          )}
                        </div>
                      );
                    }

                    // Nếu là tập truyện thông thường (Ongoing, Limited, Oneshot)
                    comicIndex++;
                    const isRead = !!readIssues[issue.id];
                    const typeClass = `issue-type-${issue.issue_type || 'ongoing'}`;

                    return (
                      <div key={issue.id} className={`issue-item ${isRead ? 'is-read' : ''}`}>
                        <div className="issue-left">
                          <span className="issue-index">#{comicIndex}</span>
                          <div
                            onClick={() => {
                              if (!isLoggedIn) {
                                openAuthModal('login', 'Đăng Nhập Để Đánh Dấu Đã Đọc');
                              }
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                          >
                            <input
                              type="checkbox"
                              className="issue-checkbox"
                              checked={isRead}
                              disabled={!isLoggedIn}
                              onChange={() => toggleRead(issue.id)}
                              style={{
                                cursor: 'pointer',
                                opacity: !isLoggedIn ? 0.35 : 1
                              }}
                              title={!isLoggedIn ? "Chưa đăng nhập - Bấm để đăng nhập và đánh dấu đã đọc" : "Đánh dấu đã đọc"}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                              <span className={`issue-title-text ${typeClass}`}>
                                {issue.title}
                              </span>
                              {issue.year && (
                                <span className="issue-year-badge">({issue.year})</span>
                              )}
                              {Boolean(issue.is_noncanon || (issue.note && /non-?canon|not canon/i.test(issue.note))) && (
                                <span className="issue-badge-noncanon">Non-canon</span>
                              )}
                            </div>
                            {(() => {
                              if (!issue.note) return null;
                              const extraNote = issue.note.replace(/^(this comic is\s*)?non-?canon\.?\s*[-:]?\s*/i, '').trim();
                              if (!extraNote) return null;
                              return (
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                  {extraNote}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="issue-actions">
                          {/* Nút Đọc Truyện (Read Link) do Admin setup */}
                          {issue.read_url ? (
                            <a
                              href={issue.read_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-read-comic"
                              title="Bấm để tới trang đọc truyện"
                            >
                              <BookOpen size={13} />
                              <span>Đọc Truyện</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="btn-no-link" title="Chưa được Admin cài đặt link đọc">
                              Chưa có link đọc
                            </span>
                          )}

                          {/* Công cụ Admin sửa nhanh Link đọc trực tiếp trên trang */}
                          {isAuthenticated && (
                            <button
                              onClick={() => handleOpenEditLink(issue)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                fontSize: '11px',
                                backgroundColor: '#222',
                                color: '#febd11',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                              title="Admin: Cài đặt / Sửa link đọc truyện cho tập này"
                            >
                              <Edit2 size={11} />
                              <span>Setup link</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          )}
          </div>
        </>
      )}
    </div>

      {/* Modal Admin Setup Link Đọc Nhanh */}
      {editingIssue && (
        <div className="search-modal-overlay" onClick={() => setEditingIssue(null)}>
          <div className="search-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px', color: '#111' }}>
              Cài Đặt Link Đọc Truyện Cho Tập:
            </h3>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px', fontWeight: 600 }}>
              {editingIssue.title}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Đường dẫn đọc truyện (URL):
              </label>
              <input
                type="url"
                value={editReadUrl}
                onChange={e => setEditReadUrl(e.target.value)}
                placeholder="https://truyen.../chap-1 hoặc link bất kỳ"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '11px', color: '#777', marginTop: '6px' }}>
                Khi người dùng bấm nút "Đọc Truyện", hệ thống sẽ chuyển hướng tới đường link này.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditingIssue(null)}
                disabled={savingIssue}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveIssueLink}
                disabled={savingIssue}
              >
                {savingIssue ? 'Đang lưu...' : 'Lưu Link Đọc'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
