import React, { useState, useEffect } from 'react';
import {
  FileText,
  Scale,
  BookOpen,
  Sparkles,
  MoreVertical,
  Copy,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  Bookmark,
  X,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ArrowRight,
} from 'lucide-react';
import {
  getRightPaneInspector,
  getAuthorityDrawer,
  mutateDraftCitation,
  mutateArgumentCitation,
  saveAuthorityToMatter,
} from '../services/workspaceApi';
import '../styles/InspectorRightPane.css';

export const InspectorRightPane = ({
  workspaceId,
  draftId,
  targetType = 'DRAFT',
  targetId = null,
  initialTab = null,
  onDraftMutated,
  onParticularSelect,
}) => {
  const isArgumentMode = targetType === 'ARGUMENT';
  const effectiveTargetId = targetId || draftId;
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    return isArgumentMode ? 'CITED' : 'PARTICULARS';
  });
  const [inspectorData, setInspectorData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Context Menu for ... on authority cards
  const [openMenuAuthId, setOpenMenuAuthId] = useState(null);

  // In-App Judgment Drawer Slide-over
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [activeDrawerData, setActiveDrawerData] = useState(null);
  const [drawerTab, setDrawerTab] = useState('IRAC'); // 'IRAC' | 'FULL_TEXT'

  // Equivalent Citations Modal
  const [showEquivModal, setShowEquivModal] = useState(null);

  // Replace Authority Modal
  const [replaceTargetId, setReplaceTargetId] = useState(null);

  // Toast
  const [toastMsg, setToastMsg] = useState(null);
  const [copiedCite, setCopiedCite] = useState(false);

  // Statute Full Text Slide-over Drawer
  const [selectedStatute, setSelectedStatute] = useState(null);
  const [copiedStatuteText, setCopiedStatuteText] = useState(false);

  const handleCopyStatuteText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedStatuteText(true);
    showToast('Copied full bare act text');
    setTimeout(() => setCopiedStatuteText(false), 2000);
  };

  const showToast = (msg, duration = 3000) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), duration);
  };

  useEffect(() => {
    if (workspaceId && (effectiveTargetId || isArgumentMode)) {
      loadInspector();
    }
  }, [workspaceId, effectiveTargetId, targetType]);

  const loadInspector = async () => {
    setLoading(true);
    try {
      const data = await getRightPaneInspector(workspaceId, {
        targetType: targetType || (draftId ? 'DRAFT' : 'ARGUMENT'),
        targetId: effectiveTargetId,
      });
      setInspectorData(data);
    } catch (err) {
      console.error('Failed to load inspector:', err);
    } finally {
      setLoading(false);
    }
  };

  // Menu Item 1: Open In-App Judgment Drawer
  const handleOpenDrawer = async (authorityId) => {
    setOpenMenuAuthId(null);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const drawer = await getAuthorityDrawer(workspaceId, authorityId);
      setActiveDrawerData(drawer);
    } catch (err) {
      console.error('Failed to fetch drawer:', err);
      showToast('Error loading judgment drawer: ' + err.message);
    } finally {
      setDrawerLoading(false);
    }
  };

  // Menu Item 2: Copy Citation
  const handleCopyCitation = async (citation) => {
    setOpenMenuAuthId(null);
    try {
      await navigator.clipboard.writeText(citation);
      setCopiedCite(true);
      setTimeout(() => setCopiedCite(false), 2000);
      showToast('Citation copied to clipboard!');
    } catch (err) {
      console.error(err);
    }
  };

  // Menu Item 3: Show Equivalent Citations
  const handleShowEquivalent = (auth) => {
    setOpenMenuAuthId(null);
    setShowEquivModal(auth);
  };

  // Menu Item 4: Replace Authority
  const handleOpenReplace = (authorityId) => {
    setOpenMenuAuthId(null);
    setReplaceTargetId(authorityId);
  };

  const handleExecuteReplace = async (replacementId) => {
    try {
      let res;
      if (isArgumentMode) {
        res = await mutateArgumentCitation(workspaceId, effectiveTargetId, {
          action: 'REPLACE',
          targetAuthorityId: replaceTargetId,
          replacementAuthorityId: replacementId,
        });
        if (onDraftMutated && (res.argumentSheet || res.sheet)) onDraftMutated(res.argumentSheet || res.sheet);
      } else {
        res = await mutateDraftCitation(workspaceId, effectiveTargetId, {
          action: 'REPLACE',
          targetAuthorityId: replaceTargetId,
          replacementAuthorityId: replacementId,
        });
        if (onDraftMutated && res.draft) onDraftMutated(res.draft);
      }
      if (res.inspector) setInspectorData(res.inspector);
      setReplaceTargetId(null);
      showToast('Authority citation replaced!');
    } catch (err) {
      console.error(err);
      showToast('Replace failed: ' + err.message);
    }
  };

  // Menu Item 5: Remove Authority
  const handleRemoveAuthority = async (authorityId) => {
    setOpenMenuAuthId(null);
    try {
      let res;
      if (isArgumentMode) {
        res = await mutateArgumentCitation(workspaceId, effectiveTargetId, {
          action: 'REMOVE',
          targetAuthorityId: authorityId,
        });
        if (onDraftMutated && (res.argumentSheet || res.sheet)) onDraftMutated(res.argumentSheet || res.sheet);
      } else {
        res = await mutateDraftCitation(workspaceId, effectiveTargetId, {
          action: 'REMOVE',
          targetAuthorityId: authorityId,
        });
        if (onDraftMutated && res.draft) onDraftMutated(res.draft);
      }
      if (res.inspector) setInspectorData(res.inspector);
      showToast('Citation removed');
    } catch (err) {
      console.error(err);
      showToast('Remove failed: ' + err.message);
    }
  };

  // Menu Item 6: Save to Matter
  const handleSaveToMatter = async (authorityId) => {
    setOpenMenuAuthId(null);
    try {
      const res = await saveAuthorityToMatter(workspaceId, authorityId);
      showToast('Authority saved to Matter vault (' + res.totalSavedAuthorities + ' total)');
      loadInspector();
    } catch (err) {
      console.error(err);
      showToast('Save to matter failed: ' + err.message);
    }
  };

  // Relevant Tab: [Use in draft] Button
  const handleUseInDraft = async (authorityId) => {
    try {
      let res;
      if (isArgumentMode) {
        res = await mutateArgumentCitation(workspaceId, effectiveTargetId, {
          action: 'USE_IN_DRAFT',
          targetAuthorityId: authorityId,
        });
        if (onDraftMutated && (res.argumentSheet || res.sheet)) onDraftMutated(res.argumentSheet || res.sheet);
        showToast('Citation pinned into courtroom arguments!');
      } else {
        res = await mutateDraftCitation(workspaceId, effectiveTargetId, {
          action: 'USE_IN_DRAFT',
          targetAuthorityId: authorityId,
          targetBlockKey: 'statutory_grounds',
        });
        if (onDraftMutated && res.draft) onDraftMutated(res.draft);
        showToast('Citation successfully pinned into draft!');
      }
      if (res.inspector) setInspectorData(res.inspector);
    } catch (err) {
      console.error(err);
      showToast('Failed to insert citation: ' + err.message);
    }
  };

  const counts = inspectorData?.countsHeader || {
    citedAuthoritiesCount: 2,
    statutesCount: 6,
    missingParticularsCount: 0,
  };

  return (
    <aside className="inspector-right-pane">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="inspector-toast">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Counts & Header */}
      <div className="inspector-top-bar">
        <div className="inspector-counts-text">
          <strong>{counts.citedAuthoritiesCount} authorities cited</strong> · {counts.statutesCount} statutes
        </div>
        {!isArgumentMode && counts.missingParticularsCount > 0 && (
          <span className="badge-missing-particulars">
            {counts.missingParticularsCount} missing
          </span>
        )}
      </div>

      {/* 4 Inspector Navigation Pills (Wireframe 2B) */}
      <div className="inspector-pills-nav">
        {!isArgumentMode && (
          <button
            className={`inspector-pill ${activeTab === 'PARTICULARS' ? 'active' : ''}`}
            onClick={() => setActiveTab('PARTICULARS')}
          >
            <FileText size={13} />
            <span>Particulars</span>
          </button>
        )}

        <button
          className={`inspector-pill ${activeTab === 'CITED' ? 'active' : ''}`}
          onClick={() => setActiveTab('CITED')}
        >
          <Scale size={13} />
          <span>Cited</span>
          <span className="pill-badge">{counts.citedAuthoritiesCount}</span>
        </button>

        <button
          className={`inspector-pill ${activeTab === 'STATUTES' ? 'active' : ''}`}
          onClick={() => setActiveTab('STATUTES')}
        >
          <BookOpen size={13} />
          <span>Statutes</span>
          <span className="pill-badge">{counts.statutesCount}</span>
        </button>

        <button
          className={`inspector-pill ${activeTab === 'RELEVANT' ? 'active' : ''}`}
          onClick={() => setActiveTab('RELEVANT')}
        >
          <Sparkles size={13} />
          <span>Relevant</span>
        </button>
      </div>

      {/* ─── TAB 1: PARTICULARS ─── */}
      {activeTab === 'PARTICULARS' && (
        <div className="inspector-tab-content">
          <p className="tab-hint">
            Live 2-way binding particulars. Edits update the draft instantly with 0 tokens.
          </p>

          <div className="particulars-groups">
            {['LOCKED_LEDGER', 'BODY', 'VERIFICATION'].map((groupName) => {
              const items = (inspectorData?.particularsTab || []).filter(
                (p) => p.sectionGroup === groupName
              );
              if (items.length === 0) return null;

              return (
                <div key={groupName} className="particular-group-box">
                  <div className="group-label">
                    {groupName === 'LOCKED_LEDGER' && '🔒 Case Fact Ledger Anchors'}
                    {groupName === 'BODY' && 'Pleading Particulars'}
                    {groupName === 'VERIFICATION' && 'Verification & Deposition'}
                  </div>

                  <div className="group-items">
                    {items.map((p) => (
                      <div
                        key={p.key}
                        className="inspector-particular-row"
                        onClick={() => onParticularSelect && onParticularSelect(p.key)}
                      >
                        <div className="part-info">
                          <span className="part-label">{p.label}</span>
                          {p.isLockedInLedger && (
                            <span className="part-lock-badge" title="Locked by lawyer against AI regressions">
                              <Lock size={10} /> Locked
                            </span>
                          )}
                        </div>
                        <span className={`part-val ${p.value ? '' : 'is-empty'}`}>
                          {p.value || 'Not specified'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 2: CITED AUTHORITIES ─── */}
      {activeTab === 'CITED' && (
        <div className="inspector-tab-content">
          <p className="tab-hint">
            Authorities actively cited within the draft. Click ... to access the 6-item context menu.
          </p>

          <div className="authorities-list">
            {(inspectorData?.citedTab || []).map((auth) => (
              <div key={auth.authorityId} className="inspector-auth-card">
                <div className="auth-card-header">
                  <div className="auth-title-block">
                    <h4>{auth.caseTitle}</h4>
                    <span className="auth-primary-cite">{auth.primaryCitation}</span>
                  </div>

                  {/* 6-Item Context Menu Button */}
                  <div className="auth-menu-wrap">
                    <button
                      className="btn-menu-dot"
                      onClick={() =>
                        setOpenMenuAuthId(openMenuAuthId === auth.authorityId ? null : auth.authorityId)
                      }
                    >
                      <MoreVertical size={15} />
                    </button>

                    {openMenuAuthId === auth.authorityId && (
                      <div className="citation-context-menu">
                        <button
                          className="context-menu-item"
                          onClick={() => handleOpenDrawer(auth.authorityId)}
                        >
                          <BookOpen size={13} />
                          <span>1. Open full judgment (In-App)</span>
                        </button>

                        <button
                          className="context-menu-item"
                          onClick={() => handleCopyCitation(auth.primaryCitation)}
                        >
                          <Copy size={13} />
                          <span>2. Copy citation</span>
                        </button>

                        <button
                          className="context-menu-item"
                          onClick={() => handleShowEquivalent(auth)}
                        >
                          <Layers size={13} />
                          <span>3. Show equivalent citations ({auth.equivalentCitations.length})</span>
                        </button>

                        <button
                          className="context-menu-item"
                          onClick={() => handleOpenReplace(auth.authorityId)}
                        >
                          <RefreshCw size={13} />
                          <span>4. Replace...</span>
                        </button>

                        <button
                          className="context-menu-item text-danger"
                          onClick={() => handleRemoveAuthority(auth.authorityId)}
                        >
                          <Trash2 size={13} />
                          <span>5. Remove from draft</span>
                        </button>

                        <button
                          className="context-menu-item text-accent"
                          onClick={() => handleSaveToMatter(auth.authorityId)}
                        >
                          <Bookmark size={13} />
                          <span>6. Save to Matter</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {auth.snippetInDraft && (
                  <div className="auth-draft-snippet">
                    <span className="snippet-lead">In the draft (Para {auth.paragraphNumberInDraft || 5}):</span>
                    <p>"{auth.snippetInDraft}"</p>
                  </div>
                )}

                <p className="auth-summary">{auth.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: STATUTES ─── */}
      {activeTab === 'STATUTES' && (
        <div className="inspector-tab-content">
          <p className="tab-hint">
            Statutory provisions pinned to this proceeding with verified bare act text.
          </p>

          <div className="statutes-provisions-list">
            {(inspectorData?.statutesTab?.provisions || []).map((prov) => (
              <div
                key={prov.statutePinId}
                className="statute-provision-card"
                onClick={() => setSelectedStatute(prov)}
              >
                <div className="prov-header">
                  <ShieldCheck size={14} className="text-indigo-600" />
                  <strong>{prov.sectionHeader}</strong>
                </div>
                <span className="prov-act-title">{prov.parentActTitle}</span>
                <p className="prov-bare-act line-clamp-3">{prov.cleanBareActText}</p>
                <button
                  type="button"
                  className="btn-view-statute-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatute(prov);
                  }}
                >
                  <span>View full provision</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Bottom Summary: Acts Used */}
          <div className="acts-summary-box">
            <span className="summary-title">Summary of Acts Used:</span>
            {(inspectorData?.statutesTab?.actsSummary || []).map((act, i) => (
              <div key={i} className="act-summary-item">
                <strong>{act.actTitle}</strong>
                <span className="sections-tag">{act.sectionsUsed.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: RELEVANT (DOMAIN SUGGESTIONS & USE IN DRAFT) ─── */}
      {activeTab === 'RELEVANT' && (
        <div className="inspector-tab-content">
          <p className="tab-hint">
            Domain-curated precedent authorities verified by Refirm Authority Firewall. Click [+ Use in draft] to insert into your pleading.
          </p>

          <div className="authorities-list">
            {(inspectorData?.relevantTab || []).map((auth) => (
              <div key={auth.authorityId} className="inspector-auth-card">
                <div className="auth-card-header">
                  <div className="auth-title-block">
                    <h4>{auth.caseTitle}</h4>
                    <span className="auth-primary-cite">{auth.primaryCitation}</span>
                  </div>

                  <button
                    className="btn-use-in-draft"
                    onClick={() => handleUseInDraft(auth.authorityId)}
                  >
                    <Plus size={13} />
                    <span>Use in draft</span>
                  </button>
                </div>

                <p className="auth-summary">{auth.summary}</p>

                <div className="auth-propositions">
                  {auth.keyPropositions.map((prop, idx) => (
                    <span key={idx} className="prop-chip">
                      • {prop}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER IN-APP JUDGMENT DRAWER (MENU ITEM 1) ─── */}
      {drawerOpen && (
        <div className="in-app-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <div className="in-app-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title-meta">
                <span className="drawer-badge">In-App Authority Drawer (Zero IndianKanoon Redirect)</span>
                <h3>{activeDrawerData?.caseTitle || 'Loading Judgment Authority...'}</h3>
                <span className="drawer-cite">{activeDrawerData?.primaryCitation}</span>
              </div>
              <button className="btn-close-drawer" onClick={() => setDrawerOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-tabs">
              <button
                className={`drawer-tab-btn ${drawerTab === 'IRAC' ? 'active' : ''}`}
                onClick={() => setDrawerTab('IRAC')}
              >
                Structured IRAC Brief
              </button>
              <button
                className={`drawer-tab-btn ${drawerTab === 'FULL_TEXT' ? 'active' : ''}`}
                onClick={() => setDrawerTab('FULL_TEXT')}
              >
                In-App Full Text ({activeDrawerData?.fullTextPages?.length || 2} Pages)
              </button>
            </div>

            <div className="drawer-body">
              {drawerLoading ? (
                <div className="drawer-loading">
                  <RefreshCw className="animate-spin" size={24} />
                  <span>Loading full-text authority from vault...</span>
                </div>
              ) : drawerTab === 'IRAC' ? (
                <div className="irac-content-view">
                  <div className="irac-block">
                    <span className="irac-label">Facts:</span>
                    <p>{activeDrawerData?.iracBrief?.facts}</p>
                  </div>

                  <div className="irac-block">
                    <span className="irac-label">Issues Framed:</span>
                    <ul>
                      {activeDrawerData?.iracBrief?.issuesFramed?.map((iss, i) => (
                        <li key={i}>{iss}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="irac-block">
                    <span className="irac-label">Statutes &amp; Provisions Cited:</span>
                    <div className="prov-tags">
                      {activeDrawerData?.iracBrief?.provisionsCited?.map((p, i) => (
                        <span key={i} className="prov-pill">{p}</span>
                      ))}
                    </div>
                  </div>

                  <div className="irac-block ratio-box">
                    <span className="irac-label text-emerald-700">Ratio Decidendi:</span>
                    <p><strong>{activeDrawerData?.iracBrief?.ratioDecidendi}</strong></p>
                  </div>

                  <div className="irac-block">
                    <span className="irac-label">Final Order Held:</span>
                    <p>{activeDrawerData?.iracBrief?.finalOrderHeld}</p>
                  </div>
                </div>
              ) : (
                <div className="full-text-pages-view">
                  {activeDrawerData?.fullTextPages?.map((page) => (
                    <div key={page.pageNumber} className="drawer-page-sheet">
                      <span className="sheet-page-num">Page {page.pageNumber}</span>
                      <pre className="sheet-markdown">{page.pageMarkdown}</pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── EQUIVALENT CITATIONS MODAL (MENU ITEM 3) ─── */}
      {showEquivModal && (
        <div className="modal-backdrop" onClick={() => setShowEquivModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Equivalent Citations</h3>
              <button onClick={() => setShowEquivModal(null)}><X size={18} /></button>
            </div>
            <p className="modal-sub">{showEquivModal.caseTitle}</p>
            <div className="equiv-cits-list">
              {showEquivModal.equivalentCitations.map((cit, idx) => (
                <div key={idx} className="equiv-cit-row">
                  <span>{cit}</span>
                  <button onClick={() => handleCopyCitation(cit)}>
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── REPLACE CITATION MODAL (MENU ITEM 4) ─── */}
      {replaceTargetId && (
        <div className="modal-backdrop" onClick={() => setReplaceTargetId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Replace Authority Citation</h3>
              <button onClick={() => setReplaceTargetId(null)}><X size={18} /></button>
            </div>
            <p className="modal-sub">
              Select a verified precedent from the domain catalog to replace this citation:
            </p>
            <div className="replace-options-list">
              {(inspectorData?.relevantTab || []).map((rel) => (
                <div
                  key={rel.authorityId}
                  className="replace-option-row"
                  onClick={() => handleExecuteReplace(rel.authorityId)}
                >
                  <div className="opt-meta">
                    <strong>{rel.caseTitle}</strong>
                    <span>{rel.primaryCitation}</span>
                  </div>
                  <ChevronRight size={14} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── STATUTE BARE ACT SLIDE-OVER DRAWER ─── */}
      {selectedStatute && (
        <div className="in-app-drawer-backdrop" onClick={() => setSelectedStatute(null)}>
          <div className="in-app-drawer-panel statute-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title-block">
                <h3>{selectedStatute.sectionHeader}</h3>
                <span className="drawer-act-sub">{selectedStatute.parentActTitle}</span>
              </div>
              <div className="drawer-header-actions">
                <button
                  className="btn-copy-statute"
                  onClick={() => handleCopyStatuteText(selectedStatute.cleanBareActText)}
                  title="Copy Section Text"
                >
                  {copiedStatuteText ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copiedStatuteText ? 'Copied' : 'Copy Section Text'}</span>
                </button>
                <button className="btn-close-drawer" onClick={() => setSelectedStatute(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="drawer-body">
              <div className="statute-drawer-content">
                <pre className="statute-full-text">{selectedStatute.cleanBareActText}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default InspectorRightPane;
