import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ChevronDown, Menu, X, Shield, LogOut, User } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { SearchModal } from './SearchModal';

export const Navbar: React.FC = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, logout, openAuthModal } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Logobar chính với Logo phong cách Comic Book Reading Orders */}
      <div className="x-logobar">
        <Logo />
      </div>

      {/* Navbar Điều Hướng */}
      <nav className="x-navbar">
        <div className="x-navbar-inner">
          {/* Nút bật tắt menu trên điện thoại */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '12px 0',
              color: '#333'
            }}
            className="mobile-menu-btn"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Menu Desktop & Mobile */}
          <ul className={`x-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            {/* Menu Marvel */}
            <li className={`menu-marvel ${location.pathname.startsWith('/universe/marvel') ? 'active' : ''}`}>
              <Link to="/universe/marvel" onClick={() => setIsMobileMenuOpen(false)}>
                Marvel <ChevronDown size={13} />
              </Link>
              <ul className="x-sub-menu">
                <li>
                  <Link to="/universe/marvel/events" onClick={() => setIsMobileMenuOpen(false)}>
                    Sự Kiện Marvel
                  </Link>
                </li>
                <li>
                  <Link to="/universe/marvel/characters" onClick={() => setIsMobileMenuOpen(false)}>
                    Nhân Vật Marvel
                  </Link>
                </li>
                <li>
                  <Link to="/universe/marvel/master" onClick={() => setIsMobileMenuOpen(false)}>
                    Thứ Tự Đọc Master
                  </Link>
                </li>
              </ul>
            </li>

            {/* Menu DC */}
            <li className={`menu-dc ${location.pathname.startsWith('/universe/dc') ? 'active' : ''}`}>
              <Link to="/universe/dc" onClick={() => setIsMobileMenuOpen(false)}>
                DC <ChevronDown size={13} />
              </Link>
              <ul className="x-sub-menu">
                <li>
                  <Link to="/universe/dc/events" onClick={() => setIsMobileMenuOpen(false)}>
                    Sự Kiện DC
                  </Link>
                </li>
                <li>
                  <Link to="/universe/dc/characters" onClick={() => setIsMobileMenuOpen(false)}>
                    Nhân Vật DC
                  </Link>
                </li>
                <li>
                  <Link to="/universe/dc/master" onClick={() => setIsMobileMenuOpen(false)}>
                    Thứ Tự Đọc Master
                  </Link>
                </li>
              </ul>
            </li>

            {/* Menu Khác */}
            <li className={location.pathname.startsWith('/universe/other') ? 'active' : ''}>
              <Link to="/universe/other" onClick={() => setIsMobileMenuOpen(false)}>
                Khác
              </Link>
            </li>

            <li className={isActive('/updates') ? 'active' : ''}>
              <Link to="/updates" onClick={() => setIsMobileMenuOpen(false)}>Cập Nhật</Link>
            </li>

            <li className={isActive('/faq') ? 'active' : ''}>
              <Link to="/faq" onClick={() => setIsMobileMenuOpen(false)}>Hỏi Đáp</Link>
            </li>

            <li className={isActive('/contact') ? 'active' : ''}>
              <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Liên Hệ</Link>
            </li>
          </ul>

          {/* Công Cụ Tìm Kiếm & Đăng Nhập */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsSearchOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#64748b',
                fontWeight: 500,
                transition: 'all 0.15s ease'
              }}
              title="Tìm kiếm thứ tự đọc (Ctrl + K)"
            >
              <Search size={14} color="#64748b" />
              <span className="search-text-label">Tìm kiếm...</span>
            </button>

            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isAdmin ? (
                  <Link
                    to="/admin"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      backgroundColor: '#1e293b',
                      color: '#febd11',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}
                    title="Bảng điều khiển Quản trị"
                  >
                    <Shield size={13} />
                    <span>Admin</span>
                  </Link>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      backgroundColor: '#f1f5f9',
                      color: '#1e293b',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}
                    title="Tài khoản độc giả"
                  >
                    <User size={13} color="#e42525" />
                    <span>{user?.display_name || user?.username}</span>
                  </div>
                )}
                <button
                  onClick={logout}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#888',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Đăng xuất"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                style={{
                  fontSize: '12px',
                  color: '#1e293b',
                  fontWeight: 600,
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '16px',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
                title="Đăng nhập tài khoản"
              >
                <User size={13} color="#e42525" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Modal tìm kiếm toàn cục */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
