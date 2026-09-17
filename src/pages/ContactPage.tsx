import React, { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { AdminQuickBar } from '../components/AdminQuickBar';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <AdminQuickBar />
      <div className="main-content">
        {/* Breadcrumb */}
        <div style={{ fontSize: '12px', color: '#777777', marginBottom: '16px' }}>
          <a href="/">Trang Chủ</a> &gt; <span style={{ color: '#222', fontWeight: 600 }}>Liên Hệ (Contact Us)</span>
        </div>

        <h1 className="h-custom-headline yellow-class accent">
          <span>Contact Us</span>
        </h1>

        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <p style={{ textAlign: 'justify', color: '#333', marginBottom: '24px', fontSize: '15px', lineHeight: '1.7' }}>
            Bạn phát hiện điều gì chưa chính xác trong một thứ tự đọc, muốn yêu cầu biên tập thứ tự đọc mới, hoặc gặp sự cố kỹ thuật trên trang web? Đừng ngần ngại liên hệ với chúng tôi. Chúng tôi luôn hoan nghênh và trân trọng mọi ý kiến đóng góp từ bạn!
          </p>

          {submitted ? (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <CheckCircle size={44} color="#16a34a" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>
                Cảm ơn bạn đã gửi tin nhắn!
              </h3>
              <p style={{ fontSize: '14px', color: '#15803d' }}>
                Đội ngũ quản trị viên sẽ xem xét và phản hồi đến bạn trong thời gian sớm nhất.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '28px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Họ và tên *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Địa chỉ Email *:
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Chủ đề:
                </label>
                <input
                  type="text"
                  placeholder="Góp ý thứ tự đọc / Báo lỗi link đọc truyện..."
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Nội dung tin nhắn *:
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Nhập nội dung cần trao đổi..."
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }}
              >
                <Send size={16} /> Gửi Tin Nhắn
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};
