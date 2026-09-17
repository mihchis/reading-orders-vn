import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ orders: any[]; issues: any[] }>({ orders: [], issues: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ orders: [], issues: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ orders: [], issues: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim());
        if (res.success) {
          setResults(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal-card" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <Search size={20} color="#888888" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Tìm kiếm sự kiện, thứ tự đọc, nhân vật, tên tập..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#666' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="search-results-box">
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
              Đang tìm kiếm...
            </div>
          )}

          {!loading && query && results.orders.length === 0 && results.issues.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
              Không tìm thấy kết quả nào phù hợp cho "<strong>{query}</strong>"
            </div>
          )}

          {/* Danh sách Reading Orders tìm thấy */}
          {results.orders.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Thứ tự đọc truyện ({results.orders.length})
              </div>
              {results.orders.map(order => (
                <Link
                  key={order.id}
                  to={`/reading-order/${order.slug}`}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    backgroundColor: '#fafafa',
                    marginBottom: '6px',
                    color: '#222'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={16} color="#e42525" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>{order.title}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {order.universe_name} • Năm {order.year_published}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', color: '#0066aa', fontWeight: 600 }}>Xem ngay &rarr;</span>
                </Link>
              ))}
            </div>
          )}

          {/* Danh sách Issues tìm thấy */}
          {results.issues.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Tập truyện ({results.issues.length})
              </div>
              {results.issues.map(issue => (
                <div
                  key={issue.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    backgroundColor: '#fafafa',
                    marginBottom: '6px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{issue.title}</div>
                    <Link
                      to={`/reading-order/${issue.order_slug}`}
                      onClick={onClose}
                      style={{ fontSize: '12px', color: '#666' }}
                    >
                      Trong: <strong>{issue.order_title}</strong>
                    </Link>
                  </div>
                  {issue.read_url && (
                    <a
                      href={issue.read_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-read-comic"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Đọc ngay <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
