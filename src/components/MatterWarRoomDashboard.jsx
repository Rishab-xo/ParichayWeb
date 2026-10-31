import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Calendar,
  X,
  FileText,
  Scale,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Upload,
} from 'lucide-react';
import {
  getMatterDashboard,
  getAuthorityDrawer,
  uploadDocument,
} from '../services/workspaceApi';
import '../styles/MatterWarRoomDashboard.css';

const formatDateDDMMYYYY = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateDayMonthYear = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const MatterWarRoomDashboard = ({
  workspace,
  onNavigateTab,
  onRefreshWorkspace,
  onStartNewChat,
  onOpenChat,
}) => {
  const workspaceId = workspace?.workspaceId;

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  // Description editing
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descText, setDescText] = useState(workspace?.description || '');

  // Track court case modal
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackCnr, setTrackCnr] = useState('');
  const [trackCourt, setTrackCourt] = useState('');
  const [trackNextHearing, setTrackNextHearing] = useState('');
  const [localCourtCases, setLocalCourtCases] = useState([]);

  // File upload input ref
  const fileInputRef = useRef(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // In-App Authority Drawer Slide-over
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerData, setDrawerData] = useState(null);
  const [drawerTab, setDrawerTab] = useState('IRAC'); // 'IRAC' | 'FULL_TEXT'

  useEffect(() => {
    if (workspaceId) {
      loadDashboard();
    }
  }, [workspaceId]);

  useEffect(() => {
    if (workspace?.description) {
      setDescText(workspace.description);
    }
  }, [workspace?.description]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await getMatterDashboard(workspaceId);
      setDashboard(data);
      if (data?.courtCasesTracked) {
        setLocalCourtCases(data.courtCasesTracked);
      }
    } catch (err) {
      console.error('Failed to load matter dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAuthorityDrawer = async (authorityId) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const data = await getAuthorityDrawer(workspaceId, authorityId);
      setDrawerData(data);
    } catch (err) {
      console.error('Failed to load authority drawer:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleSaveTrackCase = (e) => {
    e.preventDefault();
    if (!trackCnr && !trackCourt) return;
    const newCase = {
      cnr: trackCnr.trim(),
      court: trackCourt.trim(),
      nextHearingDate: trackNextHearing.trim() || 'Scheduled',
      stage: 'Scheduled for Arguments',
    };
    setLocalCourtCases((prev) => [...prev, newCase]);
    setShowTrackModal(false);
    setTrackCnr('');
    setTrackCourt('');
    setTrackNextHearing('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId) return;
    setIsUploadingFile(true);
    try {
      await uploadDocument(workspaceId, file, 'EVIDENCE_OTHER');
      await loadDashboard();
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNewChatClick = () => {
    if (onStartNewChat) {
      onStartNewChat(workspace);
    } else if (onNavigateTab) {
      onNavigateTab('chat', { workspace });
    }
  };

  const handleChatClick = (chat) => {
    if (onOpenChat) {
      onOpenChat(chat);
    } else if (onNavigateTab) {
      onNavigateTab('chat', { chat });
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="case-file-loading-state">
        <RefreshCw className="animate-spin" size={24} />
        <span>Loading case file...</span>
      </div>
    );
  }

  // Dynamic chats list
  const chatsList = dashboard?.chats || [];

  // Dynamic files list
  const rawDocs = dashboard?.fileDTOs || workspace?.documents || [];
  const filesList = rawDocs.map((d) => ({
    id: d.documentId || d.id,
    name: d.fileName || d.name || 'Document',
    size: formatFileSize(d.fileSizeBytes || d.fileSize || d.size),
    date: formatDateDayMonthYear(d.createdAt || d.updatedAt),
    raw: d,
  }));

  // Dynamic authorities list
  const authoritiesList = dashboard?.authorities || [];

  // Dynamic argument sheets list
  const argumentSheetsList = dashboard?.argumentSheets || [];

  const courtCases = localCourtCases;

  return (
    <div className="case-file-view-container">
      {/* ─── HIDDEN FILE INPUT ─── */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* ─── 1. TOP CREATED / LAST EDITED DATES ─── */}
      <div className="case-file-dates-row">
        {workspace?.createdAt && <span>Created {formatDateDDMMYYYY(workspace.createdAt)}</span>}
        {workspace?.updatedAt && <span>Last edited {formatDateDDMMYYYY(workspace.updatedAt)}</span>}
      </div>

      {/* ─── 2. TITLE ROW WITH "NEW CHAT WITH MATTER" PILL BUTTON ─── */}
      <div className="case-file-header-row">
        <h1 className="case-file-title">
          {workspace?.title || 'Untitled Matter'}
        </h1>

        <button className="btn-new-chat-pill" onClick={handleNewChatClick}>
          <span>New chat with matter</span>
        </button>
      </div>

      {/* ─── 3. STATS LINE ─── */}
      <div className="case-file-stats-line">
        <span>
          {chatsList.length} chat{chatsList.length !== 1 ? 's' : ''} · {filesList.length} file{filesList.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ─── 4. ADD DESCRIPTION ─── */}
      <div className="case-file-desc-row">
        {isEditingDesc ? (
          <div className="desc-edit-form">
            <input
              type="text"
              value={descText}
              onChange={(e) => setDescText(e.target.value)}
              placeholder="Add description..."
              className="desc-input"
              autoFocus
            />
            <button className="btn-desc-save" onClick={() => setIsEditingDesc(false)}>
              Save
            </button>
            <button className="btn-desc-cancel" onClick={() => setIsEditingDesc(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-add-desc" onClick={() => setIsEditingDesc(true)}>
            {descText ? descText : '+ Add description'}
          </button>
        )}
      </div>

      {/* ─── 5. COURT CASES SECTION ─── */}
      <div className="case-file-section">
        <div className="case-section-header">
          <h2 className="section-title">Court cases</h2>
          <button className="btn-section-action" onClick={() => setShowTrackModal(true)}>
            + Track a case
          </button>
        </div>

        {courtCases.length > 0 ? (
          <div className="court-cases-cards-wrap">
            {courtCases.map((cc, idx) => (
              <div key={idx} className="court-case-item-card">
                <div className="court-case-info-group">
                  {cc.cnr && <span className="case-cnr-pill">{cc.cnr}</span>}
                  <h4 className="case-court-heading">{cc.court}</h4>
                </div>
                {cc.nextHearingDate && (
                  <div className="case-hearing-pill">
                    <Calendar size={13} />
                    <span>Next: {cc.nextHearingDate}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-court-cases-banner">
            No court cases in this Matter. Track a case by its CNR to follow its hearings, orders and changes here.
          </div>
        )}
      </div>

      {/* ─── 6. TWO-COLUMN GRID: CHATS & FILES ─── */}
      <div className="case-file-two-col-grid">
        {/* COLUMN 1: CHATS */}
        <div className="case-col-card">
          <div className="case-col-header">
            <div className="col-title-group">
              <span className="col-title">Chats</span>
              <span className="count-pill">{chatsList.length}</span>
            </div>
            <button className="btn-col-action" onClick={handleNewChatClick}>
              + Select
            </button>
          </div>

          <div className="case-col-items-list">
            {chatsList.length > 0 ? (
              chatsList.map((chat, idx) => (
                <div
                  key={chat.workspaceId || chat.id || idx}
                  className="case-list-item-row"
                  onClick={() => handleChatClick(chat)}
                >
                  <div className="item-primary-text">{chat.title || 'Discussion'}</div>
                  <div className="item-secondary-sub">
                    {chat.type || 'Draft'} {chat.updatedAt ? `· ${formatDateDayMonthYear(chat.updatedAt)}` : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className="case-empty-column-box">
                <p className="case-empty-column-text">No chats in this Matter yet.</p>
                <button className="btn-empty-start-chat" onClick={handleNewChatClick}>
                  + Start a chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: FILES */}
        <div className="case-col-card">
          <div className="case-col-header">
            <div className="col-title-group">
              <span className="col-title">Files</span>
              <span className="count-pill">{filesList.length}</span>
            </div>
            <button
              className="btn-col-action"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile}
            >
              {isUploadingFile ? 'Uploading...' : '+ Select'}
            </button>
          </div>

          <div className="case-col-items-list">
            {filesList.length > 0 ? (
              filesList.map((file, idx) => (
                <div
                  key={file.id || idx}
                  className="case-list-item-row"
                  onClick={() => {
                    if (file.raw && onNavigateTab) {
                      onNavigateTab('review', { doc: file.raw });
                    }
                  }}
                >
                  <div className="item-primary-text">{file.name}</div>
                  <div className="item-secondary-sub">
                    {file.size} {file.date ? `· ${file.date}` : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className="case-empty-column-box">
                <p className="case-empty-column-text">No files in this Matter.</p>
                <button
                  className="btn-empty-upload-file"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingFile}
                >
                  {isUploadingFile ? 'Uploading...' : '+ Upload file'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 7. ARGUMENT SHEETS SECTION ─── */}
      <div className="case-file-section argument-sheets-section">
        <div className="case-section-header">
          <div className="col-title-group">
            <Scale size={16} className="text-indigo-600" />
            <span className="col-title">Courtroom Argument Sheets</span>
            <span className="count-pill">{argumentSheetsList.length}</span>
          </div>
          <button
            className="btn-section-action"
            onClick={() => {
              if (onNavigateTab) {
                onNavigateTab('free-arguments', { workspace });
              }
            }}
          >
            + New Argument Session
          </button>
        </div>

        <div className="case-arg-sheets-list">
          {argumentSheetsList.length > 0 ? (
            argumentSheetsList.map((sheet, idx) => (
              <div
                key={sheet.sheetId || idx}
                className="case-list-item-row arg-sheet-item-row"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab('free-arguments', { sheetId: sheet.sheetId, workspaceId, sheet });
                  }
                }}
              >
                <div className="item-primary-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="arg-version-badge">v{sheet.version || 1}</span>
                  <span className="arg-sheet-title">{sheet.title || `Argument Sheet v${sheet.version || 1}`}</span>
                  {sheet.isStale && <span className="arg-stale-tag">Needs Refresh</span>}
                </div>
                <div className="item-secondary-sub">
                  {sheet.updatedAt ? `Updated ${formatDateDayMonthYear(sheet.updatedAt)}` : 'Ready for hearing'} · Courtroom Dossier
                </div>
              </div>
            ))
          ) : (
            <div className="case-empty-column-box">
              <p className="case-empty-column-text">No courtroom argument sheets generated for this Matter yet.</p>
              <button
                className="btn-empty-start-chat"
                onClick={() => {
                  if (onNavigateTab) {
                    onNavigateTab('free-arguments', { workspace });
                  }
                }}
              >
                + Prepare Arguments
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── 8. AUTHORITIES SECTION ─── */}
      <div className="case-file-section authorities-section">
        <div className="case-section-header">
          <div className="col-title-group">
            <span className="col-title">Authorities</span>
            <span className="count-pill">{authoritiesList.length}</span>
          </div>
        </div>

        <div className="case-authorities-list">
          {authoritiesList.length > 0 ? (
            authoritiesList.map((auth, idx) => (
              <div
                key={auth.authorityId || idx}
                className="case-list-item-row authority-item-row"
                onClick={() => handleOpenAuthorityDrawer(auth.authorityId)}
              >
                <div className="item-primary-text">{auth.caseTitle || auth.authorityId}</div>
                <div className="item-secondary-sub">
                  {[auth.court, auth.date ? formatDateDayMonthYear(auth.date) : null, auth.primaryCitation].filter(Boolean).join(' · ')}
                </div>
              </div>
            ))
          ) : (
            <div className="case-empty-column-box authorities-empty-box">
              <p className="case-empty-column-text">No saved authorities in this Matter yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── TRACK A CASE MODAL ─── */}
      {showTrackModal && (
        <div className="modal-backdrop-clean" onClick={() => setShowTrackModal(false)}>
          <div className="modal-card-clean" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-clean">
              <h3>Track a Court Case by CNR</h3>
              <button className="btn-close-modal" onClick={() => setShowTrackModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveTrackCase} className="modal-form-clean">
              <div className="form-field-clean">
                <label>CNR Number</label>
                <input
                  type="text"
                  placeholder="e.g. DLCT01-002934-2026"
                  value={trackCnr}
                  onChange={(e) => setTrackCnr(e.target.value)}
                  required
                />
              </div>
              <div className="form-field-clean">
                <label>Court / Forum</label>
                <input
                  type="text"
                  placeholder="e.g. District Consumer Disputes Redressal Commission"
                  value={trackCourt}
                  onChange={(e) => setTrackCourt(e.target.value)}
                  required
                />
              </div>
              <div className="form-field-clean">
                <label>Next Hearing Date</label>
                <input
                  type="text"
                  placeholder="e.g. Monday, 5 October"
                  value={trackNextHearing}
                  onChange={(e) => setTrackNextHearing(e.target.value)}
                />
              </div>
              <div className="modal-actions-clean">
                <button type="button" className="btn-cancel-clean" onClick={() => setShowTrackModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-clean">
                  Track Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── IN-APP AUTHORITY DRAWER SLIDE-OVER ─── */}
      {drawerOpen && (
        <div className="authority-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="authority-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-header-info">
                <span className="drawer-kicker">Verified Legal Corpus</span>
                <h3 className="drawer-title">{drawerData?.caseTitle || 'Loading Precedent...'}</h3>
                <span className="drawer-primary-cit">{drawerData?.primaryCitation}</span>
              </div>
              <button className="drawer-close-btn" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-tabs-bar">
              <button
                className={`drawer-tab-btn ${drawerTab === 'IRAC' ? 'active' : ''}`}
                onClick={() => setDrawerTab('IRAC')}
              >
                IRAC Legal Brief
              </button>
              <button
                className={`drawer-tab-btn ${drawerTab === 'FULL_TEXT' ? 'active' : ''}`}
                onClick={() => setDrawerTab('FULL_TEXT')}
              >
                Full Judgment Pages
              </button>
            </div>

            <div className="drawer-content-body">
              {drawerLoading ? (
                <div className="drawer-loading">
                  <RefreshCw className="animate-spin" size={24} />
                  <span>Loading verified authority analysis...</span>
                </div>
              ) : drawerTab === 'IRAC' ? (
                <div className="drawer-irac-view">
                  <div className="irac-card">
                    <h4>Facts</h4>
                    <p>{drawerData?.iracBrief?.facts || 'Authority facts documented in verified corpus.'}</p>
                  </div>
                  <div className="irac-card">
                    <h4>Issues Framed</h4>
                    <ul>
                      {(drawerData?.iracBrief?.issuesFramed || ['Core legal issue under examination']).map((iss, i) => (
                        <li key={i}>{iss}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="irac-card highlight-card">
                    <h4>Ratio Decidendi</h4>
                    <p>{drawerData?.iracBrief?.ratioDecidendi || 'Key legal proposition established by Court.'}</p>
                  </div>
                  <div className="irac-card">
                    <h4>Final Order Held</h4>
                    <p>{drawerData?.iracBrief?.finalOrderHeld || 'Disposition of the appeal.'}</p>
                  </div>
                </div>
              ) : (
                <div className="drawer-pages-view">
                  {(drawerData?.pages || []).map((page, idx) => (
                    <div key={idx} className="drawer-page-card">
                      <div className="drawer-page-number">Page {page.pageNumber}</div>
                      <pre className="drawer-page-text">{page.markdownContent}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
