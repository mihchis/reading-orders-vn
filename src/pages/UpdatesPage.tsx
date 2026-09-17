import React from 'react';
import { Sparkles, Calendar, CheckCircle2, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminQuickBar } from '../components/AdminQuickBar';

export const UpdatesPage: React.FC = () => {
  const updates = [
    {
      date: '17/09/2026',
      title: 'Ra Mắt Phiên Bản Tiếng Việt Toàn Diện & Hệ Thống Quản Trị Đọc Truyện',
      items: [
        'Việt hóa 100% toàn bộ giao diện theo chuẩn thiết kế tham khảo Comic Book Reading Orders.',
        'Tích hợp tính năng cài đặt Link Đọc Truyện trực tiếp cho từng tập truyện (issue).',
        'Bổ sung bảng điều khiển Quản trị viên (Admin) hỗ trợ thêm, sửa, sắp xếp tập và nhập nhanh hàng loạt.',
        'Hỗ trợ tính năng đánh dấu "Đã đọc" và hiển thị thanh tiến độ đọc truyện cho người dùng.',
        'Nạp sẵn các đại sự kiện tiêu biểu: House of M, Secret Wars (2015), Planet Hulk, Avengers Disassembled, Crisis on Infinite Earths, Aquaman: Death of a Prince, The Boys, Hellboy, Marvel 2099...'
      ]
    },
    {
      date: '15/09/2026',
      title: 'Cập Nhật Các Bộ Thứ Tự Đọc Nhân Vật Tiêu Biểu Mới Nhất',
      items: [
        'Cập nhật thứ tự đọc nhân vật Marvel: Alpha Flight, The Maker, The Hood, Ironheart.',
        'Cập nhật thứ tự đọc nhân vật DC Comics: Darkseid, Huntress, Onomatopoeia.',
        'Đồng bộ trạng thái tiến độ các đại sự kiện tiếp theo: X-Men: Age of Revelation (Marvel) và DC K.O. (DC).'
      ]
    },
    {
      date: '11/08/2026',
      title: 'Cập Nhật Thứ Tự Đọc Scorpion & Các Bộ Độc Quyền',
      items: [
        'Bổ sung thứ tự đọc trọn vẹn cho Scorpion ngay sau khi xuất hiện trong Spider-Man: Brand New Day.',
        'Khởi động các bộ thứ tự đọc mới: DC All In, Marvel Master Reading Order Part 15, One World Under Doom, Jeff the Land Shark.',
        'Cập nhật đầy đủ các tie-ins và thứ tự đọc theo mạch truyện gốc.'
      ]
    }
  ];

  return (
    <>
      <AdminQuickBar />
      <div className="main-content">
        <h1 className="h-custom-headline red-class accent">
          <span>NHẬT KÝ CẬP NHẬT (UPDATES)</span>
        </h1>

        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px', fontSize: '15px' }}>
            Theo dõi những cập nhật mới nhất về các thứ tự đọc truyện, tính năng mới và danh sách các tập truyện được bổ sung.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {updates.map((up, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e42525', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>
                  <Calendar size={15} />
                  <span>{up.date}</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '14px' }}>
                  {up.title}
                </h3>
                <ul style={{ paddingLeft: '20px', color: '#475569', fontSize: '14px', lineHeight: '1.8' }}>
                  {up.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: '6px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
