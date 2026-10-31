import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Upload,
  RefreshCw,
  CheckCircle2,
  Download,
  Eye,
  Languages,
  ScanText,
  ArrowRight,
} from 'lucide-react';
import { uploadDocument, createQuickConsult } from '../services/workspaceApi';
import '../styles/DocumentsStudio.css';

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentsStudio = ({
  workspace,
  onRefresh,
  onOpenReview,
}) => {
  const workspaceId = workspace?.workspaceId;

  // Active modal: null | 'OCR' | 'TRANSLATION'
  const [activeModal, setActiveModal] = useState(null);

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('English');
  const fileInputRef = useRef(null);

  // Documents list
  const existingDocs = workspace?.documents || [];
  const [localDocs, setLocalDocs] = useState(existingDocs);

  const handleOpenModal = (type) => {
    setActiveModal(type);
    setSelectedFile(null);
    setIsDragOver(false);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setSelectedFile(null);
    setIsProcessing(false);
  };

  // Drag handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleProcessDocument = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      let activeWsId = workspaceId;
      if (!activeWsId || activeWsId === 'default-ws' || activeWsId === 'ws-default') {
        const freshWs = await createQuickConsult();
        activeWsId = freshWs.workspaceId;
      }

      const docType = activeModal === 'OCR' ? 'EVIDENCE_OTHER' : 'LEGAL_NOTICE';
      const uploadedDoc = await uploadDocument(activeWsId, selectedFile, docType);

      // Add to local state with real uploaded doc metadata
      const newDoc = {
        documentId: uploadedDoc?.documentId || `doc-${Date.now()}`,
        fileName: uploadedDoc?.fileName || selectedFile.name,
        fileSizeBytes: uploadedDoc?.fileSizeBytes || selectedFile.size,
        createdAt: uploadedDoc?.createdAt || new Date().toISOString(),
        jobType: activeModal, // 'OCR' | 'TRANSLATION'
        targetLang: activeModal === 'TRANSLATION' ? targetLanguage : null,
        workspaceId: activeWsId,
        ...uploadedDoc,
      };

      setLocalDocs((prev) => [newDoc, ...prev]);

      if (onRefresh) {
        onRefresh();
      }

      handleCloseModal();

      if (onOpenReview) {
        onOpenReview(newDoc);
      }
    } catch (err) {
      console.error('Document processing failed:', err);
      alert('Processing failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const allDocuments = localDocs.length > 0 ? localDocs : existingDocs;

  return (
    <div className="documents-studio-container">
      {/* ─── 1. HEADER TITLE & SUBTITLE ─── */}
      <div className="documents-page-header">
        <h1 className="documents-main-title">Documents</h1>
        <p className="documents-main-subtitle">
          Bring documents into Refirm, make scans searchable, translate them, and keep them.
        </p>
      </div>

      {/* ─── 2. TWO ACTION CARDS: OCR & TRANSLATION ─── */}
      <div className="documents-action-cards-grid">
        {/* CARD 1: OCR */}
        <div className="doc-feature-card" onClick={() => handleOpenModal('OCR')}>
          <div className="doc-card-icon-wrap">
            <svg
              className="doc-card-svg-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 8V5a1 1 0 0 1 1-1h3" />
              <path d="M16 4h3a1 1 0 0 1 1 1v3" />
              <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
              <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
              <rect x="8" y="7" width="8" height="10" rx="1" />
              <path d="M10 10h4" />
              <path d="M10 13h4" />
            </svg>
          </div>
          <div className="doc-card-text-col">
            <h3 className="doc-card-title">OCR</h3>
            <p className="doc-card-desc">Turn scans into working legal documents</p>
          </div>
        </div>

        {/* CARD 2: TRANSLATION */}
        <div className="doc-feature-card" onClick={() => handleOpenModal('TRANSLATION')}>
          <div className="doc-card-icon-wrap">
            <svg
              className="doc-card-svg-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#18181b"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="11" height="15" rx="2" stroke="#18181b" />
              <path d="M6 14.5l2.5-6 2.5 6" />
              <path d="M7 12.5h3" />
              <rect x="10" y="6" width="11" height="15" rx="2" fill="#ffffff" stroke="#18181b" />
              <text x="12.5" y="17" fontSize="9" fontWeight="bold" fill="#18181b" fontFamily="sans-serif">
                अ
              </text>
            </svg>
          </div>
          <div className="doc-card-text-col">
            <h3 className="doc-card-title">Translation</h3>
            <p className="doc-card-desc">Legal translation that keeps the document intact</p>
          </div>
        </div>
      </div>

      {/* ─── 3. SECTION: YOUR DOCUMENTS ─── */}
      <div className="your-documents-section">
        <h2 className="your-documents-heading">Your documents</h2>

        {allDocuments.length === 0 ? (
          /* EMPTY STATE (EXACT SCREENSHOT 1) */
          <div className="documents-empty-state">
            <div className="empty-state-title">No documents yet</div>
            <p className="empty-state-body">
              Start with either job above. Once Refirm has read a document, it stays here, ready for
              Review, Translation and your Matters without uploading it again.
            </p>
          </div>
        ) : (
          /* POPULATED DOCUMENTS LIST */
          <div className="documents-populated-list">
            {allDocuments.map((doc, idx) => (
              <div key={doc.documentId || idx} className="document-list-row">
                <div className="doc-row-left">
                  <div className="doc-type-icon">
                    <FileText size={20} className="text-zinc-600" />
                  </div>
                  <div className="doc-row-info">
                    <strong className="doc-file-name">{doc.fileName}</strong>
                    <div className="doc-meta-tags">
                      <span>{formatFileSize(doc.fileSizeBytes || doc.fileSize)}</span>
                      <span className="meta-sep">•</span>
                      <span>
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </span>
                      {doc.jobType && (
                        <span className="doc-job-badge">
                          {doc.jobType === 'TRANSLATION'
                            ? `Translated to ${doc.targetLang || 'English'}`
                            : 'OCR Searchable'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="doc-row-actions">
                  <button
                    className="btn-doc-row-action"
                    onClick={() => onOpenReview && onOpenReview(doc)}
                    title="Open Document Review Studio"
                  >
                    <Eye size={15} />
                    <span>Review</span>
                  </button>
                  <button
                    className="btn-doc-row-action"
                    onClick={() => handleOpenModal('TRANSLATION')}
                    title="Translate Document"
                  >
                    <Languages size={15} />
                    <span>Translate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 4. DRAG AND DROP MODAL (EXACT SCREENSHOT 2) ─── */}
      {activeModal && (
        <div className="doc-modal-backdrop" onClick={handleCloseModal}>
          <div className="doc-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="doc-modal-header">
              <div className="doc-modal-title-col">
                <h3 className="doc-modal-title">
                  {activeModal === 'TRANSLATION'
                    ? 'Translate a document'
                    : 'Scan a document with OCR'}
                </h3>
                <p className="doc-modal-subtitle">
                  {activeModal === 'TRANSLATION'
                    ? 'Translate a document into another language while preserving its meaning and structure.'
                    : 'Extract searchable, selectable text from scanned legal PDFs and court records.'}
                </p>
              </div>

              <button className="doc-modal-close-btn" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            {/* Translation Target Language Selector */}
            {activeModal === 'TRANSLATION' && (
              <div className="doc-lang-selector-row">
                <label>Target Language:</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="doc-target-lang-select"
                >
                  <option value="English">English</option>
                  <option value="Hindi (हिंदी)">Hindi (हिंदी)</option>
                  <option value="Marathi (मराठी)">Marathi (मराठी)</option>
                  <option value="Bengali (বাংলা)">Bengali (বাংলা)</option>
                  <option value="Tamil (தமிழ்)">Tamil (தமிழ்)</option>
                  <option value="Gujarati (ગુજરાતી)">Gujarati (ગુજરાતી)</option>
                </select>
              </div>
            )}

            {/* Drag & Drop Zone Box (Screenshot 2) */}
            <div
              className={`doc-dropzone-box ${isDragOver ? 'is-drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />

              {/* Cloud Icon */}
              <div className="dropzone-cloud-icon">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                  <path d="M12 12v9" />
                  <path d="m16 16-4-4-4 4" />
                </svg>
              </div>

              {selectedFile ? (
                <div className="dropzone-file-selected" onClick={(e) => e.stopPropagation()}>
                  <div className="selected-file-badge">
                    <FileText size={16} className="text-indigo-600" />
                    <strong>{selectedFile.name}</strong>
                    <span>({formatFileSize(selectedFile.size)})</span>
                    <button
                      className="btn-clear-selected-file"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <button
                    className="btn-process-submit"
                    onClick={handleProcessDocument}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="animate-spin" size={15} />
                        <span>Processing with AI...</span>
                      </>
                    ) : (
                      <span>
                        {activeModal === 'TRANSLATION'
                          ? `Translate into ${targetLanguage} (3 credits)`
                          : 'Run OCR Scan (3 credits)'}
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div className="dropzone-main-text">
                    Drop a PDF, Word document or scan here
                  </div>
                  <div className="dropzone-sub-link">
                    or <span className="browse-files-link">browse files</span>
                  </div>
                </>
              )}
            </div>

            {/* Credit Note (Screenshot 2) */}
            <div className="doc-modal-footer-credit-note">
              Uses 3 AI credits.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsStudio;
