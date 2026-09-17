import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        login(data.token, data.admin);
        navigate('/admin');
      } else {
        setError(data.message || 'Đăng nhập không thành công');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#ffffff',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            backgroundColor: '#e42525',
            color: '#ffffff',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Shield size={26} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#111' }}>ĐĂNG NHẬP QUẢN TRỊ VIÊN</h2>
          <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
            Hệ thống quản lý thứ tự đọc và link truyện
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            borderRadius: '4px',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Tài khoản Admin:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <User size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              Mật khẩu:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <Lock size={16} color="#888" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }}
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          border: '1px dashed #d1d5db',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#555'
        }}>
          <strong>Tài khoản mặc định:</strong> admin / admin123
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/" style={{ fontSize: '13px', color: '#666', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <ArrowLeft size={14} /> Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};
