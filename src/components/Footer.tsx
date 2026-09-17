import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="x-colophon">
      <div style={{ maxWidth: '960px', margin: '0 auto', lineHeight: '1.8' }}>
        <div style={{ marginBottom: '14px', fontWeight: 600 }}>
          <Link to="/">Trang Chủ</Link> | 
          <Link to="/universe/marvel">Marvel</Link> | 
          <Link to="/universe/dc">DC Comics</Link> | 
          <Link to="/universe/other">Khác</Link> | 
          <Link to="/faq">Hỏi Đáp</Link> | 
          <Link to="/contact">Liên Hệ</Link> | 
          <Link to="/admin">Khu Vực Quản Trị</Link>
        </div>
        <p style={{ fontSize: '12px', color: '#888888', maxWidth: '750px', margin: '0 auto 12px' }}>
          Comic Book Reading Orders là chuyên trang sắp xếp thứ tự đọc truyện tranh chuẩn xác và đầy đủ nhất dành cho cộng đồng độc giả Việt Nam.
          Mọi tên nhân vật, tựa đề truyện và bản quyền thuộc về Marvel Comics, DC Comics, Dark Horse, Image, IDW và các tác giả tương ứng.
        </p>
        <p style={{ fontSize: '11px', color: '#666666' }}>
          &copy; {new Date().getFullYear()} Comic Book Reading Orders. Đã Việt hóa toàn bộ giao diện và phát triển hệ thống quản lý.
        </p>
      </div>
    </footer>
  );
};
