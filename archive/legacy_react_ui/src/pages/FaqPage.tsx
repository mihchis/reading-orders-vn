import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { AdminQuickBar } from '../components/AdminQuickBar';

export const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFaqs()
      .then(res => {
        if (res.success) setFaqs(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AdminQuickBar />
      <div className="main-content">
        <h1 className="h-custom-headline red-class accent">
          <span>HỎI ĐÁP THƯỜNG GẶP (FAQ)</span>
        </h1>

        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px', fontSize: '15px' }}>
            Tổng hợp các câu hỏi phổ biến nhất về cách sử dụng thứ tự đọc truyện tranh và các tính năng trên website.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Đang tải câu hỏi...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={faq.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: isOpen ? '#e42525' : '#1e293b'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HelpCircle size={18} color={isOpen ? '#e42525' : '#64748b'} />
                        <span>{faq.question}</span>
                      </div>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isOpen && (
                      <div style={{
                        padding: '0 20px 20px 48px',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        color: '#475569',
                        borderTop: '1px solid #f8fafc'
                      }}>
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
