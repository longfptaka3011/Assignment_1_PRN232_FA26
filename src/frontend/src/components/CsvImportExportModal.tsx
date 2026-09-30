import React, { useState } from 'react';
import { ProjectDetail, Sprint, ImportResult } from '../types';
import { api } from '../services/api';
import {
  X,
  Download,
  Upload,
  FileUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CsvImportExportModalProps {
  project: ProjectDetail;
  activeSprint?: Sprint;
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const CsvImportExportModal: React.FC<CsvImportExportModalProps> = ({
  project,
  activeSprint,
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [exportScope, setExportScope] = useState<'all' | 'sprint'>('all');
  const [exporting, setExporting] = useState(false);

  // Import states
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    try {
      const sprintId = exportScope === 'sprint' ? activeSprint?.id : undefined;
      const blob = await api.exportCsv(project.id, sprintId);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.key}_issues_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('Xuất CSV thất bại: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      setErrorMsg('');
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setErrorMsg('Vui lòng chọn file CSV hoặc nhập nội dung CSV.');
      return;
    }

    setImporting(true);
    setErrorMsg('');
    try {
      const result = await api.importCsv(project.id, csvText);
      setImportResult(result);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      console.error('Import failed:', err);
      setErrorMsg('Nhập CSV thất bại: ' + (err.message || 'Dữ liệu không hợp lệ'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setTab('export')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'export' ? 'var(--accent-primary)' : 'transparent',
                color: tab === 'export' ? '#fff' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Download size={16} />
              <span>Xuất CSV (Export)</span>
            </button>
            <button
              onClick={() => setTab('import')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: tab === 'import' ? 'var(--accent-primary)' : 'transparent',
                color: tab === 'import' ? '#fff' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <Upload size={16} />
              <span>Nhập CSV (Import)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {tab === 'export' ? (
            <div>
              <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                Xuất danh sách issues của dự án <strong>{project.name}</strong> sang file CSV tương thích chuẩn Jira.
                File CSV bao gồm: Mã Issue, Loại, Tiêu đề, Mô tả, Trạng thái, Độ ưu tiên, Người thực hiện, Story Points và Thời gian tạo.
              </p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Phạm vi xuất dữ liệu:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="exportScope"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                    />
                    <span>Toàn bộ issues trong dự án ({project.name})</span>
                  </label>
                  {activeSprint && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="exportScope"
                        checked={exportScope === 'sprint'}
                        onChange={() => setExportScope('sprint')}
                      />
                      <span>Chỉ issues thuộc Sprint hiện tại ({activeSprint.name})</span>
                    </label>
                  )}
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: exporting ? 'not-allowed' : 'pointer'
                }}
              >
                <Download size={18} />
                <span>{exporting ? 'Đang tạo file CSV...' : 'Tải xuống File CSV'}</span>
              </button>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                Tải lên file CSV chứa danh sách issues để nhập vào dự án. Cột tương thích Jira:
                <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>Summary</code>,
                <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>Issue Type</code>,
                <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>Priority</code>,
                <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px' }}>Story Points</code>.
              </p>

              {/* Upload Dropzone */}
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  marginBottom: '16px',
                  cursor: 'pointer'
                }}
              >
                <FileUp size={36} style={{ margin: '0 auto 8px auto', color: 'var(--accent-primary)' }} />
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {fileName ? fileName : 'Kéo thả file CSV vào đây hoặc click để chọn'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chấp nhận định dạng .csv chuẩn UTF-8</div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  style={{
                    display: 'inline-block',
                    marginTop: '12px',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Chọn file từ máy
                </label>
              </div>

              {/* Optional Textarea editor */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Xem trước / Chỉnh sửa nội dung CSV:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Summary,Issue Type,Priority,Story Points&#10;Implement User Authentication,Task,High,3&#10;Design Responsive Navbar,Story,Medium,5"
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {importResult && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', marginBottom: '16px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', marginBottom: '4px' }}>
                    <CheckCircle2 size={18} />
                    <span>Nhập thành công {importResult.importedCount} / {importResult.totalProcessed} issues!</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Các mã issue mới: {importResult.importedKeys.join(', ')}
                  </div>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={importing || !csvText.trim()}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: (importing || !csvText.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                <Upload size={18} />
                <span>{importing ? 'Đang nhập dữ liệu...' : 'Xác Nhận Import Issues'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
