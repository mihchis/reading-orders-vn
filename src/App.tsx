import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { UniversePage } from './pages/UniversePage';
import { ReadingOrderDetailPage } from './pages/ReadingOrderDetailPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminOrderEditPage } from './pages/AdminOrderEditPage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';
import { UpdatesPage } from './pages/UpdatesPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="site-wrapper">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/universe/:slug" element={<UniversePage />} />
            <Route path="/universe/:slug/:category" element={<UniversePage />} />
            <Route path="/reading-order/:slug" element={<ReadingOrderDetailPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/updates" element={<UpdatesPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/reading-orders/:id" element={<AdminOrderEditPage />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};
