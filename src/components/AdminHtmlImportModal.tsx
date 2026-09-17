import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileCode, CheckCircle, AlertCircle, X, Sparkles, ArrowRight, Eye, Trash2 } from 'lucide-react';
import { api } from '../services/api';

interface AdminHtmlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (slug: string) => void;
}

export const AdminHtmlImportModal: React.FC<AdminHtmlImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [fileName, setFileName] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [deleteSourceFile, setDeleteSourceFile] = useState(true);
  const [importing, setImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtmlContent(content);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleParse = async () => {
    if (!htmlContent.trim()) {
      setErrorMessage('Vui lòng chọn file HTML hoặc dán mã nguồn HTML trước khi bóc tách.');
      return;
    }

    setParsing(true);
    setErrorMessage('');
    try {
      const res = await api.admin.parseHtml(htmlContent, fileName);
      if (res.success && res.data) {
        setParsedData(res.data);
      } else {
        setErrorMessage(res.message || 'Không thể bóc tách nội dung HTML');
      }
    } catch (err: any) {
      setErrorMessage('Lỗi khi gửi yêu cầu bóc tách: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  const handleSaveImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    setErrorMessage('');
    try {
      const res = await api.admin.importReadingOrder(parsedData, deleteSourceFile, fileName);
      if (res.success) {
        alert(res.message || 'Nhập thứ tự đọc thành công!');
        onSuccess(parsedData.slug);
        onClose();
      } else {
        setErrorMessage(res.message || 'Lỗi khi lưu thứ tự đọc vào hệ thống');
      }
    } catch (err: any) {
      setErrorMessage('Lỗi máy chủ: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setFileName('');
    setHtmlContent('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="search-modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="search-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
      >
        {/* Header Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileCode size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Bóc Tách Tự Động Từ File HTML
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Tải lên file HTML mẫu từ Comic Book Reading Orders, hệ thống sẽ tự động trích xuất toàn bộ dữ liệu.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '13px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {!parsedData ? (
          /* Bước 1: Chọn file hoặc dán HTML */
          <div>
            <div style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '28px 20px',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'all 0.2s ease'
            }}
            onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".html,.htm"
                style={{ display: 'none' }}
              />
              <Upload size={32} color="#64748b" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                {fileName ? `Đã chọn: ${fileName}` : 'Bấm vào đây để chọn file HTML (hoặc kéo thả)'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Hỗ trợ các file .html lưu từ comicbookreadingorders.com
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Hoặc dán trực tiếp mã HTML vào đây:
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => { setHtmlContent(e.target.value); setErrorMessage(''); }}
                placeholder="Dán toàn bộ mã HTML của trang web vào đây nếu không có file..."
                rows={7}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleParse}
                disabled={parsing || !htmlContent.trim()}
                className="btn-primary"
                style={{
                  padding: '8px 20px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: parsing || !htmlContent.trim() ? 0.6 : 1
                }}
              >
                <Sparkles size={15} />
                <span>{parsing ? 'Đang bóc tách dữ liệu...' : 'Bóc Tách Dữ Liệu (Parse)'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Bước 2: Xem trước kết quả bóc tách và xác nhận lưu */
          <div>
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, fontSize: '14px' }}>
                <CheckCircle size={18} />
                <span>Bóc tách thành công! Vui lòng kiểm tra thông tin bên dưới:</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#166534',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Chọn file khác
              </button>
            </div>

            {/* Thông tin chung */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tiêu đề sự kiện:</label>
                <input
                  type="text"
                  value={parsedData.title}
                  onChange={(e) => setParsedData({ ...parsedData, title: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Đường dẫn tĩnh (Slug):</label>
                <input
                  type="text"
                  value={parsedData.slug}
                  onChange={(e) => setParsedData({ ...parsedData, slug: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Vũ trụ:</label>
                <select
                  value={parsedData.universe_slug}
                  onChange={(e) => setParsedData({ ...parsedData, universe_slug: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="marvel">Marvel Comics</option>
                  <option value="dc">DC Comics</option>
                  <option value="other">Khác (Other: Dark Horse, IDW, Image...)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Năm xuất bản:</label>
                <input
                  type="text"
                  value={parsedData.year_published}
                  onChange={(e) => setParsedData({ ...parsedData, year_published: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Nhân vật nổi bật:</label>
              <input
                type="text"
                value={parsedData.featured_characters}
                onChange={(e) => setParsedData({ ...parsedData, featured_characters: e.target.value })}
                style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Tóm tắt cốt truyện:</label>
              <textarea
                value={parsedData.description}
                onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '7px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>

            {/* Thống kê chi tiết các tập */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
              padding: '12px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{parsedData.stats?.total}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TỔNG MỤC</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#166534' }}>{parsedData.stats?.comicIssues}</div>
                <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>TẬP TRUYỆN THẬT</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>{parsedData.stats?.comments}</div>
                <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>GHI CHÚ ĐỌC</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>{parsedData.stats?.limited}</div>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>LIMITED</div>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>{parsedData.stats?.oneshots}</div>
                <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>ONE-SHOTS</div>
              </div>
            </div>

            {/* Danh sách tập xem trước */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Danh sách tập truyện xem trước (Hiển thị mẫu các tập đầu và cuối):
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '6px 10px', width: '50px' }}>STT</th>
                      <th style={{ padding: '6px 10px' }}>Tên Tập / Nội Dung</th>
                      <th style={{ padding: '6px 10px', width: '90px' }}>Loại</th>
                      <th style={{ padding: '6px 10px', width: '70px' }}>Năm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.issues?.slice(0, 15).map((iss: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px', color: '#888' }}>#{idx + 1}</td>
                        <td style={{ padding: '6px 10px', fontWeight: iss.issue_type === 'comment' ? 600 : 500 }}>
                          <span style={{ verticalAlign: 'middle' }}>{iss.title}</span>
                          {Boolean(iss.is_noncanon) && (
                            <span className="issue-badge-noncanon" style={{ marginLeft: '6px' }}>Non-canon</span>
                          )}
                          {iss.note && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{iss.note}</div>
                          )}
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '3px',
                            backgroundColor:
                              iss.issue_type === 'comment' ? '#dbeafe' :
                              iss.issue_type === 'limited' ? '#dcfce7' :
                              iss.issue_type === 'oneshot' ? '#fee2e2' : '#f1f5f9',
                            color:
                              iss.issue_type === 'comment' ? '#1d4ed8' :
                              iss.issue_type === 'limited' ? '#15803d' :
                              iss.issue_type === 'oneshot' ? '#b91c1c' : '#334155',
                          }}>
                            {iss.issue_type}
                          </span>
                        </td>
                        <td style={{ padding: '6px 10px', color: '#64748b' }}>{iss.year || '-'}</td>
                      </tr>
                    ))}
                    {parsedData.issues?.length > 15 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '8px', color: '#64748b', fontStyle: 'italic', backgroundColor: '#fafafa' }}>
                          ... và {parsedData.issues.length - 15} tập tiếp theo ...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tùy chọn dọn dẹp file nguồn */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={deleteSourceFile}
                  onChange={(e) => setDeleteSourceFile(e.target.checked)}
                />
                <span>Tự động xóa file nguồn trong thư mục <code>tham_khao</code> sau khi nhập thành công</span>
              </label>
            </div>

            {/* Nút lưu */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary"
                style={{ padding: '9px 16px', fontSize: '13px' }}
              >
                Hủy & Làm lại
              </button>
              <button
                type="button"
                onClick={handleSaveImport}
                disabled={importing}
                className="btn-primary"
                style={{
                  padding: '9px 22px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: importing ? 0.7 : 1
                }}
              >
                <CheckCircle size={15} />
                <span>{importing ? 'Đang lưu vào hệ thống...' : 'Xác Nhận Lưu Vào Hệ Thống'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
