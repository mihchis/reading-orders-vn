import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, BookOpen, Layers, Link2, Plus, Edit, Trash2, Eye, Search, AlertCircle, FileCode } from 'lucide-react';
import { api, ReadingOrderItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { AdminQuickBar } from '../components/AdminQuickBar';
import { AdminHtmlImportModal } from '../components/AdminHtmlImportModal';

export const AdminDashboardPage: React.FC = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [stats, setStats] = useState<{ totalOrders: number; totalIssues: number; totalReadLinks: number; totalUniverses: number }>({
    totalOrders: 0,
    totalIssues: 0,
    totalReadLinks: 0,
    totalUniverses: 0,
  });
  const [orders, setOrders] = useState<ReadingOrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUniverse, setSelectedUniverse] = useState('');
  const [loading, setLoading] = useState(true);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.admin.getStats(),
        api.getReadingOrders(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (ordersRes.success) setOrders(ordersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: number, title: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thứ tự đọc "${title}" cùng toàn bộ tập truyện bên trong không?`)) {
      return;
    }

    try {
      const res = await api.admin.deleteReadingOrder(id);
      if (res.success) {
        setOrders(orders.filter(o => o.id !== id));
        loadData();
      } else {
        alert(res.message || 'Lỗi khi xóa thứ tự đọc');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối máy chủ');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (o.featured_characters && o.featured_characters.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesUniverse = selectedUniverse ? o.universe_slug === selectedUniverse : true;
    return matchesSearch && matchesUniverse;
  });

  return (
    <>
      <AdminQuickBar />
      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#111' }}>
              BẢNG ĐIỀU KHIỂN QUẢN TRỊ VIÊN
            </h1>
            <p style={{ fontSize: '13px', color: '#666' }}>
              Quản lý danh sách thứ tự đọc, các tập truyện (issues) và cấu hình link đọc truyện
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
              title="Tải lên file HTML để bóc tách tự động"
            >
              <FileCode size={16} />
              <span>Bóc Tách Tự Động Từ HTML</span>
            </button>

            <Link to="/admin/reading-orders/new" className="btn-primary" style={{ padding: '10px 18px' }}>
              <Plus size={16} /> Tạo Thứ Tự Đọc Mới
            </Link>
          </div>
        </div>

        {/* 4 Thẻ Thống Kê Nhanh */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Thứ Tự Đọc</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{stats.totalOrders}</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tổng Số Tập Truyện</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{stats.totalIssues}</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Link2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tập Đã Có Link Đọc</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{stats.totalReadLinks}</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vũ Trụ Quản Lý</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{stats.totalUniverses}</div>
            </div>
          </div>
        </div>

        {/* Bộ Lọc & Tìm Kiếm */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <input
                type="text"
                placeholder="Tìm thứ tự đọc hoặc nhân vật..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            </div>

            <select
              value={selectedUniverse}
              onChange={e => setSelectedUniverse(e.target.value)}
              style={{
                padding: '9px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Tất cả Vũ Trụ</option>
              <option value="marvel">Marvel</option>
              <option value="dc">DC Comics</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Hiển thị <strong>{filteredOrders.length}</strong> thứ tự đọc
          </div>
        </div>

        {/* Bảng Danh Sách Thứ Tự Đọc */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>Tiêu Đề Thứ Tự Đọc</th>
                <th style={{ padding: '12px 16px' }}>Vũ Trụ</th>
                <th style={{ padding: '12px 16px' }}>Năm</th>
                <th style={{ padding: '12px 16px' }}>Số Tập</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Không tìm thấy thứ tự đọc nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                        {order.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        /reading-order/{order.slug}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: order.universe_slug === 'marvel' ? '#fee2e2' : order.universe_slug === 'dc' ? '#e0f2fe' : '#f1f5f9',
                        color: order.universe_slug === 'marvel' ? '#b91c1c' : order.universe_slug === 'dc' ? '#0369a1' : '#334155'
                      }}>
                        {order.universe_name}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>
                      {order.year_published || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {order.issue_count > 0 ? (
                        <><strong style={{ color: '#0f172a' }}>{order.issue_count}</strong> tập</>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '11px', backgroundColor: '#fee2e2', padding: '3px 8px', borderRadius: '4px' }}>
                          Sắp có
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        {/* Quản lý tập truyện & Link đọc */}
                        <Link
                          to={`/admin/reading-orders/${order.id}`}
                          className="btn-primary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Sắp xếp tập & Cài đặt link đọc truyện"
                        >
                          <Edit size={13} />
                          <span>Quản lý tập &amp; Link đọc</span>
                        </Link>

                        {/* Xem ngoài web */}
                        <Link
                          to={`/reading-order/${order.slug}`}
                          target="_blank"
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          title="Xem trang hiển thị người dùng"
                        >
                          <Eye size={13} />
                        </Link>

                        {/* Xóa */}
                        <button
                          onClick={() => handleDeleteOrder(order.id, order.title)}
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title="Xóa thứ tự đọc"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminHtmlImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(slug) => {
          loadData();
          navigate('/reading-order/' + slug);
        }}
      />
    </>
  );
};
