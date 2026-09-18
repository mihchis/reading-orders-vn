import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthModal } from '../components/AuthModal';

export interface AuthUser {
  id: number;
  username: string;
  display_name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  admin: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean; // Alias for isAdmin (backward compatibility)
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  openAuthModal: (mode?: 'login' | 'register', title?: string) => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  admin: null,
  token: null,
  isLoggedIn: false,
  isAdmin: false,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  openAuthModal: () => {},
  closeAuthModal: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token') || localStorage.getItem('admin_token')
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');
  const [modalTitle, setModalTitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (token) {
      // Xác thực token với server
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setUser(data.user);
          } else if (data.success && data.admin) {
            setUser({ ...data.admin, role: 'admin' });
          } else {
            logout();
          }
        })
        .catch(() => logout());
    }
  }, [token]);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('auth_token', newToken);
    if (newUser.role === 'admin') {
      localStorage.setItem('admin_token', newToken);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_token');
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login', title?: string) => {
    setModalMode(mode);
    setModalTitle(title);
    setModalOpen(true);
  };

  const closeAuthModal = () => {
    setModalOpen(false);
  };

  const isAdmin = user?.role === 'admin';
  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        admin: isAdmin ? user : null,
        token,
        isLoggedIn,
        isAdmin,
        isAuthenticated: isAdmin,
        login,
        logout,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      <AuthModal
        isOpen={modalOpen}
        onClose={closeAuthModal}
        defaultMode={modalMode}
        customTitle={modalTitle}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
