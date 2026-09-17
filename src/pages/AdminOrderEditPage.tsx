import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Link2, FileText, Check, AlertCircle } from 'lucide-react';
import { api, ReadingOrderItem, IssueItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AdminQuickBar } from '../components/AdminQuickBar';

export const AdminOrderEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Form thông tin chung của Reading Order
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    universe_id: 1,
    description: '',
    year_published: '',
    featured_characters: '',
    previous_event_title: '',
    previous_event_slug: '',
    next_event_title: '',
    next_event_slug: '',
  });

  // Danh sách các tập truyện
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Form thêm tập đơn lẻ
  const [newIssue, setNewIssue] = useState({
    title: '',
    issue_type: 'ongoing',
    year: '',
    note: '',
    read_url: '',
    is_noncanon: 0,
    tab_type: 'single'
  });

  // Khung nhập nhanh hàng loạt (Bulk Add)
  const [bulkText, setBulkText] = useState('');
  const [bulkType, setBulkType] = useState('ongoing');
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    if (!isNew && id) {
      loadOrderData(Number(id));
    }
  }, [id, isAuthenticated]);

  const loadOrderData = async (orderId: number) => {
    setLoading(true);
    try {
      // Lấy danh sách orders để tìm slug
      const all = await api.getReadingOrders();
      const match = all.data?.find((o: ReadingOrderItem) => o.id === orderId);
      if (match) {
        const detail = await api.getReadingOrderDetail(match.slug);
        if (detail.success && detail.data) {
          const d = detail.data;
          setFormData({
            title: d.title || '',
            slug: d.slug || '',
            universe_id: d.universe_id || 1,
            description: d.description || '',
            year_published: d.year_published || '',
            featured_characters: d.featured_characters || '',
            previous_event_title: d.previous_event_title || '',
            previous_event_slug: d.previous_event_slug || '',
            next_event_title: d.next_event_title || '',
            next_event_slug: d.next_event_slug || '',
          });
          setIssues(d.issues || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lưu thông tin Reading Order
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      if (isNew) {
        const res = await api.admin.createReadingOrder(formData);
        if (res.success) {
          setMessage('Tạo thứ tự đọc mới thành công!');
          setTimeout(() => navigate(`/admin/reading-orders/${res.id}`), 1000);
        } else {
          alert(res.message || 'Lỗi khi tạo thứ tự đọc');
        }
      } else {
        const res = await api.admin.updateReadingOrder(Number(id), formData);
        if (res.success) {
          setMessage('Đã lưu thông tin thứ tự đọc thành công!');
        } else {
          alert(res.message || 'Lỗi khi lưu thứ tự đọc');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  // Thêm 1 tập truyện mới
  const handleAddSingleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue.title.trim()) return;
    if (isNew) {
      alert('Vui lòng lưu tạo Thứ Tự Đọc trước khi thêm tập truyện!');
      return;
    }

    try {
      const res = await api.admin.addIssues(Number(id), [newIssue]);
      if (res.success) {
        setNewIssue({
          title: '',
          issue_type: 'ongoing',
          year: '',
          note: '',
          read_url: '',
          is_noncanon: 0,
          tab_type: 'single'
        });
        loadOrderData(Number(id));
      } else {
        alert(res.message || 'Lỗi khi thêm tập');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi thêm tập');
    }
  };

  // Thêm hàng loạt tập truyện bằng cách dán văn bản
  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    const issuesToAdd = lines.map(line => ({
      title: line,
      issue_type: bulkType,
      tab_type: 'single'
    }));

    try {
      const res = await api.admin.addIssues(Number(id), issuesToAdd);
      if (res.success) {
        setBulkText('');
        setShowBulkModal(false);
        loadOrderData(Number(id));
      } else {
        alert(res.message || 'Lỗi khi thêm hàng loạt');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối máy chủ');
    }
  };

  // Cập nhật link đọc truyện của 1 issue
  const handleUpdateReadUrl = async (issueId: number, newUrl: string) => {
    try {
      await api.admin.updateIssue(issueId, { read_url: newUrl.trim() });
      setIssues(issues.map(i => i.id === issueId ? { ...i, read_url: newUrl.trim() } : i));
    } catch (err) {
      console.error(err);
      alert('Lỗi khi cập nhật link');
    }
  };

  // Cập nhật loại tập của 1 issue
  const handleUpdateIssueType = async (issueId: number, newType: any) => {
    try {
      await api.admin.updateIssue(issueId, { issue_type: newType });
      setIssues(issues.map(i => i.id === issueId ? { ...i, issue_type: newType } : i));
    } catch (err) {
      console.error(err);
    }
  };

  // Bật / tắt nhãn Non-canon của 1 issue
  const handleToggleNonCanon = async (issueId: number, currentVal: any) => {
    const newVal = currentVal ? 0 : 1;
    try {
      await api.admin.updateIssue(issueId, { is_noncanon: newVal });
      setIssues(issues.map(i => i.id === issueId ? { ...i, is_noncanon: newVal } : i));
    } catch (err) {
      console.error(err);
      alert('Lỗi khi cập nhật trạng thái Non-canon');
    }
  };

  // Xóa 1 tập truyện
  const handleDeleteIssue = async (issueId: number, title: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tập "${title}"?`)) return;
    try {
      const res = await api.admin.deleteIssue(issueId);
      if (res.success) {
        setIssues(issues.filter(i => i.id !== issueId));
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa tập');
    }
  };

  // Di chuyển thứ tự tập (Lên / Xuống)
  const handleMoveIssue = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === issues.length - 1)) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...issues];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    // Gán lại sort_order
    const payload = reordered.map((item, idx) => ({
      id: item.id,
      sort_order: idx + 1
    }));

    setIssues(reordered);

    try {
      await api.admin.reorderIssues(Number(id), payload);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu vị trí sắp xếp');
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', padding: '60px' }}>
        <h3>Đang tải dữ liệu...</h3>
      </div>
    );
  }

  return (
    <>
      <AdminQuickBar currentOrderId={Number(id)} />
      <div className="main-content">
        <div style={{ marginBottom: '20px' }}>
          <Link to="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
            <ArrowLeft size={14} /> Quay lại Bảng Điều Khiển
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111' }}>
              {isNew ? 'TẠO MỚI THỨ TỰ ĐỌC (READING ORDER)' : `CHỈNH SỬA: ${formData.title}`}
            </h1>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Cài đặt thông tin sự kiện và thiết lập link đọc truyện cho từng tập
            </p>
          </div>

          {!isNew && (
            <Link
              to={`/reading-order/${formData.slug}`}
              target="_blank"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={14} /> Xem trang ngoài web
            </Link>
          )}
        </div>

        {message && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#dcfce7',
            color: '#166534',
            borderRadius: '4px',
            marginBottom: '20px',
            fontWeight: 600
          }}>
            <Check size={16} />
            <span>{message}</span>
          </div>
        )}

        {/* Khối 1: Form thông tin sự kiện */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '24px',
          marginBottom: '36px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', color: '#0f172a' }}>
            1. THÔNG TIN CHUNG THỨ TỰ ĐỌC
          </h2>

          <form onSubmit={handleSaveOrder}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Tiêu Đề (Title) *:
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ví dụ: House of M, Secret Wars (2015)..."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Đường dẫn tĩnh (Slug):
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Tự động sinh nếu để trống (ví dụ: house-of-m)"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Vũ Trụ:
                </label>
                <select
                  value={formData.universe_id}
                  onChange={e => setFormData({ ...formData, universe_id: Number(e.target.value) })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                >
                  <option value={1}>Marvel</option>
                  <option value={2}>DC Comics</option>
                  <option value={3}>Khác (Other)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Năm Xuất Bản:
                </label>
                <input
                  type="text"
                  value={formData.year_published}
                  onChange={e => setFormData({ ...formData, year_published: e.target.value })}
                  placeholder="Ví dụ: 2005 hoặc 1985-1986"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Nhân Vật Nổi Bật:
              </label>
              <input
                type="text"
                value={formData.featured_characters}
                onChange={e => setFormData({ ...formData, featured_characters: e.target.value })}
                placeholder="Ví dụ: X-Men, Scarlet Witch, Avengers, Magneto..."
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                Tóm Tắt Cốt Truyện / Giới Thiệu:
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập nội dung tóm tắt cốt truyện sự kiện..."
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Sự Kiện Trước (Previous Event):
                </label>
                <input
                  type="text"
                  value={formData.previous_event_title}
                  onChange={e => setFormData({ ...formData, previous_event_title: e.target.value })}
                  placeholder="Ví dụ: Avengers Disassembled"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Sự Kiện Sau (Next Event):
                </label>
                <input
                  type="text"
                  value={formData.next_event_title}
                  onChange={e => setFormData({ ...formData, next_event_title: e.target.value })}
                  placeholder="Ví dụ: Decimation"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={15} />
              <span>{saving ? 'Đang lưu...' : 'Lưu Thông Tin Sự Kiện'}</span>
            </button>
          </form>
        </div>

        {/* Khối 2: Quản lý các tập truyện và Link Đọc Truyện (Chỉ hiện khi đã tạo order) */}
        {!isNew && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '24px',
            marginBottom: '40px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  2. DANH SÁCH TẬP TRUYỆN &amp; SETUP CHỖ ĐỌC TRUYỆN ({issues.length} TẬP)
                </h2>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                  Mỗi tập truyện đều có ô điền <strong>Link Đọc Truyện</strong> riêng biệt. Người dùng bấm vào tập truyện sẽ được đưa tới trang đọc đó.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="btn-secondary"
                  style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileText size={14} /> Nhập Hàng Loạt (Bulk Add)
                </button>
              </div>
            </div>

            {/* Form thêm 1 tập mới */}
            <form onSubmit={handleAddSingleIssue} style={{
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '12px' }}>
                + Thêm Tập Truyện Mới:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.9fr 1.8fr auto', gap: '12px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Tên Tập Truyện *:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: House of M #1"
                    value={newIssue.title}
                    onChange={e => setNewIssue({ ...newIssue, title: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Phân Loại:
                  </label>
                  <select
                    value={newIssue.issue_type}
                    onChange={e => setNewIssue({ ...newIssue, issue_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="ongoing">Series Dài Kỳ (Đen)</option>
                    <option value="limited">Series Giới Hạn (Xanh Lá)</option>
                    <option value="oneshot">One-Shot (Đỏ)</option>
                    <option value="comment">Ghi Chú Đọc (Xanh Dương)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Tab:
                  </label>
                  <select
                    value={newIssue.tab_type || 'single'}
                    onChange={e => setNewIssue({ ...newIssue, tab_type: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="single">Single Issues</option>
                    <option value="tpb">TPBs</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                    Năm:
                  </label>
                  <input
                    type="text"
                    placeholder="2005"
                    value={newIssue.year}
                    onChange={e => setNewIssue({ ...newIssue, year: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px', color: '#e42525' }}>
                    Link Đọc Truyện (Read URL):
                  </label>
                  <input
                    type="url"
                    placeholder="https://truyen.../chap-1"
                    value={newIssue.read_url}
                    onChange={e => setNewIssue({ ...newIssue, read_url: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: '#c2410c' }} title="Tập truyện này thuộc mạch truyện Non-canon">
                    <input
                      type="checkbox"
                      checked={Boolean(newIssue.is_noncanon)}
                      onChange={e => setNewIssue({ ...newIssue, is_noncanon: e.target.checked ? 1 : 0 })}
                      style={{ cursor: 'pointer' }}
                    />
                    Non-canon
                  </label>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    <Plus size={14} /> Thêm Tập
                  </button>
                </div>
              </div>
            </form>

            {/* Bảng danh sách các tập truyện */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '10px 12px', width: '70px' }}>Thứ Tự</th>
                    <th style={{ padding: '10px 12px' }}>Tên Tập Truyện</th>
                    <th style={{ padding: '10px 12px', width: '140px' }}>Phân Loại</th>
                    <th style={{ padding: '10px 12px' }}>Chỗ Đọc / Link Đọc Truyện (Read URL)</th>
                    <th style={{ padding: '10px 12px', width: '110px', textAlign: 'center' }}>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                        Chưa có tập truyện nào trong danh sách. Hãy thêm tập truyện mới ở trên!
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue, index) => (
                      <tr key={issue.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        {/* Cột điều chỉnh vị trí sắp xếp */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#64748b', minWidth: '22px' }}>#{index + 1}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveIssue(index, 'up')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                                  padding: '1px',
                                  opacity: index === 0 ? 0.3 : 1
                                }}
                                title="Đẩy lên trên"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                disabled={index === issues.length - 1}
                                onClick={() => handleMoveIssue(index, 'down')}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: index === issues.length - 1 ? 'not-allowed' : 'pointer',
                                  padding: '1px',
                                  opacity: index === issues.length - 1 ? 0.3 : 1
                                }}
                                title="Hạ xuống dưới"
                              >
                                <ArrowDown size={12} />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Tên tập */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                            <span style={{
                              fontWeight: 600,
                              color: issue.issue_type === 'limited' ? '#008000' : issue.issue_type === 'oneshot' ? '#ff0000' : issue.issue_type === 'comment' ? '#0000ff' : '#222'
                            }}>
                              {issue.title}
                            </span>
                            {issue.year && <span style={{ fontSize: '11px', color: '#888' }}>({issue.year})</span>}
                            {issue.tab_type === 'tpb' && (
                              <span style={{
                                backgroundColor: '#f3e8ff',
                                color: '#7e22ce',
                                border: '1px solid #d8b4fe',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '3px',
                                marginLeft: '2px'
                              }}>
                                TPB
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleToggleNonCanon(issue.id, issue.is_noncanon)}
                              style={{
                                border: issue.is_noncanon ? '1px solid #fed7aa' : '1px dashed #cbd5e1',
                                backgroundColor: issue.is_noncanon ? '#fff7ed' : '#f8fafc',
                                color: issue.is_noncanon ? '#c2410c' : '#94a3b8',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginLeft: '4px'
                              }}
                              title="Bấm để bật/tắt nhãn Non-canon"
                            >
                              {issue.is_noncanon ? 'Non-canon' : '+ Non-canon'}
                            </button>
                          </div>
                          {issue.note && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {issue.note}
                            </div>
                          )}
                        </td>

                        {/* Phân loại */}
                        <td style={{ padding: '10px 12px' }}>
                          <select
                            value={issue.issue_type}
                            onChange={e => handleUpdateIssueType(issue.id, e.target.value)}
                            style={{
                              padding: '4px 6px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#fff'
                            }}
                          >
                            <option value="ongoing">Dài Kỳ (Đen)</option>
                            <option value="limited">Giới Hạn (Xanh)</option>
                            <option value="oneshot">One-Shot (Đỏ)</option>
                            <option value="comment">Ghi Chú (Lam)</option>
                          </select>
                        </td>

                        {/* Ô SETUP CHỖ ĐỌC TRUYỆN */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="url"
                              placeholder="Cài đặt link đọc cho người dùng bấm vào..."
                              defaultValue={issue.read_url || ''}
                              onBlur={e => {
                                if (e.target.value !== (issue.read_url || '')) {
                                  handleUpdateReadUrl(issue.id, e.target.value);
                                }
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 10px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: issue.read_url ? '#f0fdf4' : '#ffffff',
                                color: issue.read_url ? '#166534' : '#333'
                              }}
                            />
                            {issue.read_url && (
                              <a
                                href={issue.read_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '5px 8px',
                                  backgroundColor: '#e2e8f0',
                                  color: '#334155',
                                  borderRadius: '3px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                                title="Bấm thử link đọc"
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Xóa tập */}
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteIssue(issue.id, issue.title)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                              padding: '4px'
                            }}
                            title="Xóa tập này"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Nhập Hàng Loạt (Bulk Add) */}
        {showBulkModal && (
          <div className="search-modal-overlay" onClick={() => setShowBulkModal(false)}>
            <div className="search-modal-card" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px', color: '#111' }}>
                Nhập Hàng Loạt Tập Truyện (Bulk Import)
              </h3>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
                Dán danh sách các tập truyện (mỗi dòng một tập). Hệ thống sẽ tự động tạo từng tập theo đúng thứ tự!
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Phân Loại Mặc Định:
                </label>
                <select
                  value={bulkType}
                  onChange={e => setBulkType(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                >
                  <option value="ongoing">Series Dài Kỳ (Ongoing - Đen)</option>
                  <option value="limited">Series Giới Hạn (Limited - Xanh Lá)</option>
                  <option value="oneshot">One-Shots (Đỏ)</option>
                  <option value="comment">Ghi Chú Đọc (Comments - Xanh Dương)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                  Danh Sách Tập Truyện (Mỗi dòng 1 tập):
                </label>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  placeholder={"House of M #1\nHouse of M #2\nHouse of M #3\nSpider-Man: House of M #1\nSpider-Man: House of M #2"}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowBulkModal(false)}>
                  Hủy
                </button>
                <button type="button" className="btn-primary" onClick={handleBulkAdd}>
                  Thêm Tất Cả
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
