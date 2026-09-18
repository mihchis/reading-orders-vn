import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Settings, Edit3, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminQuickBar: React.FC<{ currentOrderId?: number }> = ({ currentOrderId }) => {
  const { admin, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !admin) return null;

  return (
    <div className="admin-quick-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#febd11' }}>
          <Shield size={15} />
          <strong>Quản Trị Viên: {admin.display_name || admin.username}</strong>
        </div>

        <Link to="/admin" style={{ fontSize: '12px' }}>
          <Settings size={13} />
          <span>Bảng Điều Khiển</span>
        </Link>

        {currentOrderId && (
          <>
            <Link to={`/admin/reading-orders/${currentOrderId}`} style={{ fontSize: '12px', color: '#4ade80' }}>
              <Edit3 size={13} />
              <span>Chỉnh sửa bài này &amp; Tập truyện</span>
            </Link>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/admin/reading-orders/new" style={{ fontSize: '12px', color: '#60a5fa' }}>
          <PlusCircle size={13} />
          <span>Tạo Thứ Tự Mới</span>
        </Link>
        <button onClick={logout} style={{ fontSize: '12px' }}>
          <LogOut size={13} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};
