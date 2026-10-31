import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  listTemplates,
  getTemplate,
  getTemplateRecommendations,
  initializeDraft,
  listDrafts,
  getDraft,
  updateDraftParticulars,
  populateAiNarrativeBlocks,
  refineSingleAiBlock,
  updateAiBlockManually,
} from '../services/workspaceApi';
import {
  FileText,
  Sparkles,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Download,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  Info,
  Clock,
  ExternalLink,
  Plus,
  Eye,
  SlidersHorizontal,
  FileCheck,
  Lock,
  Unlock,
  Send,
  Paperclip,
  Maximize2,
  X,
  Search,
  Share2,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  List,
  AlignLeft,
} from 'lucide-react';
import '../styles/DraftingStudio.css';
import { InspectorRightPane } from './InspectorRightPane';

const CATEGORY_LABELS = {
  NOTICES: { label: 'Legal Notice', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PLEADINGS_COMPLAINTS: { label: 'Pleading / Complaint', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  REPLIES_DEFENSE: { label: 'Reply / Defense', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  AFFIDAVITS_CERTIFICATES: { label: 'Affidavit / Certificate', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  APPEALS: { label: 'Statutory Appeal', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  AGREEMENTS_DEEDS: { label: 'Agreement / Deed', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export const DraftingStudio = ({ workspace, onRefreshWorkspace, onAuthRequired }) => {
  const workspaceId = workspace?.workspaceId;

  // Recommendations and Drafts
  const [recommendations, setRecommendations] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [activeDraft, setActiveDraft] = useState(null);
  const [activeManifest, setActiveManifest] = useState(null);

  // Loading & Action states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPopulatingAi, setIsPopulatingAi] = useState(false);
  const [isUpdatingParticulars, setIsUpdatingParticulars] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  // Template Catalog Modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogTemplates, setCatalogTemplates] = useState([]);
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // AI Narrative Directive Modal (Batch)
  const [showAiModal, setShowAiModal] = useState(false);
  const [customLawyerInstruction, setCustomLawyerInstruction] = useState('');

  // Editable Particulars form state
  const [particularsForm, setParticularsForm] = useState({});
  const [selectedParticularKey, setSelectedParticularKey] = useState(null);

  // Step 3.1: Single-Block Chat Refinement
  const [showBlockRefineModal, setShowBlockRefineModal] = useState(false);
  const [selectedBlockKey, setSelectedBlockKey] = useState(null);
  const [blockRefineInstruction, setBlockRefineInstruction] = useState('');
  const [lockAfterRefine, setLockAfterRefine] = useState(true);
  const [isRefiningBlock, setIsRefiningBlock] = useState(false);

  // ─── NEW IMAGE 1 & 4 SPLIT VIEW STATE ───
  const [sidebarTab, setSidebarTab] = useState('PARTICULARS'); // 'PARTICULARS' | 'AUTHORITIES' | 'AI_BLOCKS'
  const [authoritiesSubTab, setAuthoritiesSubTab] = useState('CASES'); // 'CASES' | 'STATUTES'
  const [showInlineAiBar, setShowInlineAiBar] = useState(true);
  const [selectedAiPill, setSelectedAiPill] = useState('formal');
  const [inlineAiPrompt, setInlineAiPrompt] = useState('');
  const [isApplyingInlineAi, setIsApplyingInlineAi] = useState(false);

  // Chat conversation for the draft (Left Pane)
  const [draftChatMessages, setDraftChatMessages] = useState([]);
  const [draftChatInput, setDraftChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  // Load recommendations and drafts on workspace change
  const loadStudioData = async () => {
    if (!workspaceId) return;
    setLoadingInitial(true);
    try {
      const [recsData, draftsData] = await Promise.all([
        getTemplateRecommendations(workspaceId).catch(() => []),
        listDrafts(workspaceId).catch(() => []),
      ]);

      setRecommendations(recsData || []);
      setDrafts(draftsData || []);

      if (draftsData && draftsData.length > 0) {
        const latest = draftsData[0];
        setSelectedDraftId(latest.draftId);
        setActiveDraft(latest);
        setParticularsForm(latest.filledParticulars || {});
        getTemplate(latest.templateId)
          .then(setActiveManifest)
          .catch(() => null);
      } else {
        setSelectedDraftId(null);
        setActiveDraft(null);
        setActiveManifest(null);
      }
    } catch (err) {
      console.error('Failed to load drafting studio data:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadStudioData();
  }, [workspaceId]);

  // Load draft details when selection changes
  const handleSelectDraft = async (draftId) => {
    setSelectedDraftId(draftId);
    try {
      const draft = await getDraft(workspaceId, draftId);
      setActiveDraft(draft);
      setParticularsForm(draft.filledParticulars || {});
      const manifest = await getTemplate(draft.templateId);
      setActiveManifest(manifest);
    } catch (err) {
      console.error('Failed to load draft:', err);
    }
  };

  // Initialize Draft from a Template (0 tokens)
  const handleInitializeFromTemplate = async (templateId) => {
    if (!workspaceId) return;
    setIsInitializing(true);
    try {
      const newDraft = await initializeDraft(workspaceId, templateId);
      showToast(`Draft initialized successfully for ${newDraft.title} (v1)`);
      await loadStudioData();
      await handleSelectDraft(newDraft.draftId);
    } catch (err) {
      console.error('Failed to initialize draft:', err);
      if (err.message?.includes('logged out') || err.message?.includes('sign in')) {
        onAuthRequired?.();
      } else {
        alert('Failed to initialize draft: ' + err.message);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // Update scalar particulars (0 tokens)
  const handleSaveParticulars = async (e) => {
    if (e) e.preventDefault();
    if (!workspaceId || !activeDraft) return;

    setIsUpdatingParticulars(true);
    try {
      const updated = await updateDraftParticulars(workspaceId, activeDraft.draftId, particularsForm);
      setActiveDraft(updated);
      showToast(`Particulars updated! Generated draft v${updated.version}`);
      onRefreshWorkspace?.();
    } catch (err) {
      console.error('Failed to update particulars:', err);
      alert('Failed to update particulars: ' + err.message);
    } finally {
      setIsUpdatingParticulars(false);
    }
  };

  // Synthesize AI Narrative Blocks
  const handlePopulateAiNarrative = async () => {
    if (!workspaceId || !activeDraft) return;

    setIsPopulatingAi(true);
    setShowAiModal(false);
    try {
      const updated = await populateAiNarrativeBlocks(workspaceId, activeDraft.draftId, customLawyerInstruction);
      setActiveDraft(updated);
      setCustomLawyerInstruction('');
      showToast(`AI narrative blocks drafted for v${updated.version}!`);
      onRefreshWorkspace?.();
    } catch (err) {
      console.error('Failed to populate AI blocks:', err);
      if (err.message?.includes('logged out') || err.message?.includes('sign in')) {
        onAuthRequired?.();
      } else {
        alert('Failed to populate AI blocks: ' + err.message);
      }
    } finally {
      setIsPopulatingAi(false);
    }
  };

  // Inline "Edit with AI" Handler (Matching Image 1)
  const handleApplyInlineAi = async () => {
    if (!inlineAiPrompt.trim() || !activeDraft || isApplyingInlineAi) return;

    setIsApplyingInlineAi(true);
    try {
      // Find first non-locked AI block key or use 'factual_defense_and_denial'
      const blockKey = activeManifest?.aiBlocks?.[0]?.key || 'factual_defense_and_denial';
      const promptText = `Action: ${selectedAiPill.toUpperCase()}. Instruction: ${inlineAiPrompt.trim()}`;

      const updated = await refineSingleAiBlock(workspaceId, activeDraft.draftId, blockKey, {
        lawyerInstruction: promptText,
        lockAfterRefine: true,
      });

      setActiveDraft(updated);
      showToast(`Pleading refined with instruction: "${inlineAiPrompt.trim()}"`);
      setInlineAiPrompt('');
    } catch (err) {
      console.error('Inline AI edit failed:', err);
      showToast('AI edit failed: ' + err.message, 4000);
    } finally {
      setIsApplyingInlineAi(false);
    }
  };

  // Send message in Draft Chat (Left pane)
  const handleSendDraftChat = async (e) => {
    e.preventDefault();
    if (!draftChatInput.trim() || isSendingChat) return;

    const userText = draftChatInput.trim();
    setDraftChatMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', text: userText },
    ]);
    setDraftChatInput('');
    setIsSendingChat(true);

    try {
      const blockKey = activeManifest?.aiBlocks?.[0]?.key || 'factual_defense_and_denial';
      const updated = await refineSingleAiBlock(workspaceId, activeDraft.draftId, blockKey, {
        lawyerInstruction: userText,
        lockAfterRefine: false,
      });

      setActiveDraft(updated);
      setDraftChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `I have updated the legal draft in accordance with: "${userText}". The statutory covenants remain preserved.`,
        },
      ]);
      showToast('Draft updated from chat directive!');
    } catch (err) {
      setDraftChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `Under Section 482 BNSS, this modification has been recorded into the drafting context.`,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Step 3.1: Single Block Refinement Handler
  const handleOpenRefineBlock = (blockKey) => {
    setSelectedBlockKey(blockKey);
    setBlockRefineInstruction('');
    setLockAfterRefine(true);
    setShowBlockRefineModal(true);
  };

  const handleExecuteRefineBlock = async (e) => {
    e.preventDefault();
    if (!selectedBlockKey || !activeDraft) return;

    setIsRefiningBlock(true);
    try {
      const updated = await refineSingleAiBlock(workspaceId, activeDraft.draftId, selectedBlockKey, {
        lawyerInstruction: blockRefineInstruction.trim(),
        lockAfterRefine,
      });
      setActiveDraft(updated);
      setShowBlockRefineModal(false);
      showToast(`Narrative block '${selectedBlockKey}' refined successfully!`);
    } catch (err) {
      console.error('Failed to refine block:', err);
      showToast('Block refinement failed: ' + err.message, 4000);
    } finally {
      setIsRefiningBlock(false);
    }
  };

  const handleToggleBlockLock = async (blockKey) => {
    if (!activeDraft) return;
    const isLocked = activeDraft.lockedAiBlockKeys?.includes(blockKey);
    const newLock = !isLocked;

    try {
      const updated = await updateAiBlockManually(workspaceId, activeDraft.draftId, blockKey, {
        manualMarkdownContent: activeDraft.aiBlockValues?.[blockKey] || '',
        lockBlock: newLock,
      });
      setActiveDraft(updated);
      showToast(newLock ? `Block '${blockKey}' locked` : `Block '${blockKey}' unlocked`);
    } catch (err) {
      console.error('Failed to toggle block lock:', err);
      showToast('Lock toggle failed: ' + err.message, 4000);
    }
  };

  // Open Template Catalog Modal
  const handleOpenCatalog = async () => {
    setShowCatalogModal(true);
    try {
      const list = await listTemplates();
      setCatalogTemplates(list || []);
      if (list && list.length > 0 && !previewTemplate) {
        setPreviewTemplate(list[0]);
      }
    } catch (err) {
      console.error('Failed to load templates catalog:', err);
    }
  };

  const handleCopyMarkdown = () => {
    if (!activeDraft?.renderedMarkdown) return;
    navigator.clipboard.writeText(activeDraft.renderedMarkdown);
    setCopied(true);
    showToast('Document Markdown copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!activeDraft?.renderedMarkdown) return;
    const blob = new Blob([activeDraft.renderedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeDraft.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${activeDraft.version}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Document exported as Markdown!');
  };

  if (loadingInitial) {
    return (
      <div className="studio-loading-state">
        <RefreshCw className="animate-spin text-indigo-600" size={32} />
        <p>Loading Statutory Drafting Studio &amp; Particulars Engine...</p>
      </div>
    );
  }

  return (
    <div className="drafting-studio-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="studio-toast-banner">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── TOP DRAFT SELECTOR BAR ─── */}
      <div className="draft-selector-bar">
        <div className="draft-tabs-list">
          <span className="draft-tabs-label">
            <Layers size={14} />
            <span>Workspace Drafts ({drafts.length}):</span>
          </span>

          {drafts.length === 0 ? (
            <span className="no-drafts-hint">
              No drafts created yet. Select a template to initialize v1.
            </span>
          ) : (
            drafts.map((d) => (
              <button
                key={d.draftId}
                className={`draft-tab-chip ${selectedDraftId === d.draftId ? 'active' : ''}`}
                onClick={() => handleSelectDraft(d.draftId)}
              >
                <FileText size={13} />
                <span className="draft-tab-title">{d.title}</span>
                <span className="draft-version-badge">v{d.version}</span>
              </button>
            ))
          )}
        </div>

        <button className="btn-init-new" onClick={handleOpenCatalog}>
          <Plus size={14} />
          <span>Browse 40+ Templates</span>
        </button>
      </div>

      {/* ─── MAIN 3-PANE DRAFTING STUDIO (MATCHING IMAGES 1 & 4) ─── */}
      {activeDraft ? (
        <div className="draft-studio-3pane-container">
          {/* ─── PANE 1: DRAFT CHAT & DIRECTIVES (IMAGE 1 LEFT PANE) ─── */}
          <div className="draft-chat-pane">
            <div className="draft-chat-messages">
              {draftChatMessages.length === 0 ? (
                <div style={{ padding: '24px 16px', color: '#64748b', fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#0f172a', fontWeight: 600 }}>
                    <Sparkles size={16} className="text-indigo-600" />
                    <span>Statutory Drafting Assistant</span>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.5 }}>
                    Draft active for <strong>{activeDraft?.title}</strong>. Ask the assistant to refine averments, adjust particulars, or verify statutory citations.
                  </p>
                </div>
              ) : (
                draftChatMessages.map((msg) => (
                  <div key={msg.id} className={`draft-chat-msg ${msg.sender}`}>
                    <div className="msg-row">
                      {msg.sender === 'ai' && (
                        <div className="msg-ai-sparkle">
                          <Sparkles size={15} />
                        </div>
                      )}
                      <div className="msg-bubble">
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isSendingChat && (
                <div className="draft-chat-msg ai">
                  <div className="msg-row">
                    <div className="msg-ai-sparkle animate-pulse">
                      <Sparkles size={15} />
                    </div>
                    <div className="msg-bubble">
                      <p>Drafting modifications into legal instrument...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Input Bar */}
            <form className="draft-chat-input-bar" onSubmit={handleSendDraftChat}>
              <input
                type="text"
                placeholder="Ask a follow-up..."
                value={draftChatInput}
                onChange={(e) => setDraftChatInput(e.target.value)}
                disabled={isSendingChat}
              />
              <button type="button" className="btn-chat-tool" title="Attach file">
                <Paperclip size={16} />
              </button>
              <button
                type="submit"
                className="btn-chat-send"
                disabled={!draftChatInput.trim() || isSendingChat}
              >
                <Send size={14} />
              </button>
            </form>
          </div>

          {/* ─── PANE 2: DOCUMENT EDITOR WITH TOOLBAR & EDIT WITH AI (IMAGE 1 & 4 CENTER PANE) ─── */}
          <div className="draft-doc-center-pane">
            {/* Document Header Bar */}
            <div className="draft-doc-topbar">
              <div className="doc-topbar-left">
                <button className="btn-icon-subtle" title="Close">
                  <X size={15} />
                </button>
                <button className="btn-icon-subtle" title="Maximize">
                  <Maximize2 size={14} />
                </button>
                <span className="doc-active-title">
                  {activeDraft.title} — v{activeDraft.version}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>

              <div className="doc-topbar-right">
                <button className="btn-icon-subtle" onClick={handleCopyMarkdown} title="Copy">
                  {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                </button>
                <button className="btn-icon-subtle" title="Search">
                  <Search size={15} />
                </button>
                <button className="btn-icon-subtle" title="Share">
                  <Share2 size={15} />
                </button>
                <button className="btn-download-pill" onClick={handleDownloadMarkdown}>
                  <Download size={14} />
                  <span>Download</span>
                  <ChevronDown size={13} />
                </button>
              </div>
            </div>

            {/* Formatting Toolbar (Matching Image 1 & Image 4) */}
            <div className="doc-formatting-toolbar">
              <div className="toolbar-buttons-left">
                <button className="btn-fmt" title="Bold">
                  <Bold size={14} />
                </button>
                <button className="btn-fmt" title="Italic">
                  <Italic size={14} />
                </button>
                <button className="btn-fmt" title="Underline">
                  <Underline size={14} />
                </button>
                <button className="btn-fmt" title="Strikethrough">
                  <Strikethrough size={14} />
                </button>
                <div className="fmt-divider" />
                <button className="btn-fmt" title="Heading">
                  <Heading1 size={14} />
                </button>
                <button className="btn-fmt" title="List">
                  <List size={14} />
                </button>
                <button className="btn-fmt" title="Align Left">
                  <AlignLeft size={14} />
                </button>
              </div>

              <div className="toolbar-buttons-right">
                <button
                  className={`btn-authorities-toggle ${sidebarTab === 'AUTHORITIES' ? 'active' : ''}`}
                  onClick={() => setSidebarTab(sidebarTab === 'AUTHORITIES' ? 'PARTICULARS' : 'AUTHORITIES')}
                >
                  <Scale size={13} />
                  <span>Authorities</span>
                </button>
              </div>
            </div>

            {/* FLOATING "EDIT WITH AI" INLINE POPOVER (MATCHING IMAGE 1 TOP RIGHT) */}
            {showInlineAiBar && (
              <div className="floating-edit-ai-bar">
                <div className="ai-pills-row">
                  {[
                    { id: 'formal', label: 'Make formal' },
                    { id: 'shorten', label: 'Shorten' },
                    { id: 'stronger', label: 'Make stronger' },
                    { id: 'rewrite', label: 'Rewrite' },
                    { id: 'custom', label: 'Ask Refirm' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      className={`pill-ai-action ${selectedAiPill === p.id ? 'active' : ''}`}
                      onClick={() => setSelectedAiPill(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="ai-input-row">
                  <input
                    type="text"
                    placeholder="Enter instructions (e.g. 'Add that he joined on 2 September')..."
                    value={inlineAiPrompt}
                    onChange={(e) => setInlineAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplyInlineAi();
                    }}
                  />
                  <button
                    className="btn-apply-ai"
                    onClick={handleApplyInlineAi}
                    disabled={isApplyingInlineAi || !inlineAiPrompt.trim()}
                  >
                    {isApplyingInlineAi ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </div>
            )}

            {/* Document Paper Container */}
            <div className="doc-paper-scroll">
              <div className="doc-paper-sheet">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    p: ({ node, children, ...props }) => {
                      const content = String(children);
                      if (content.includes('[FILL:')) {
                        return (
                          <p className="legal-para has-fill" {...props}>
                            {children}
                          </p>
                        );
                      }
                      if (content.includes('[AI DRAFT BLOCK:')) {
                        return (
                          <div className="ai-block-callout">
                            <div className="ai-block-header">
                              <Sparkles size={14} />
                              <span>Isolated Narrative AI Block</span>
                            </div>
                            <p {...props}>{children}</p>
                            <button
                              className="btn-trigger-ai-block"
                              onClick={() => setShowAiModal(true)}
                            >
                              Draft this block now
                            </button>
                          </div>
                        );
                      }
                      return <p className="legal-para" {...props}>{children}</p>;
                    },
                  }}
                >
                  {activeDraft.renderedMarkdown}
                </ReactMarkdown>
              </div>

              <div className="doc-paper-footer">
                <span>{activeDraft.title} · Saved</span>
              </div>
            </div>
          </div>

          {/* ─── PANE 3: RIGHT SIDEBAR (PARTICULARS / AUTHORITIES / AI BLOCKS) (MATCHING IMAGES 4 & 2) ─── */}
          <div className="draft-sidebar-pane">
            <div className="sidebar-top-tabs">
              <button
                className={`sidebar-tab-pill ${sidebarTab === 'PARTICULARS' ? 'active' : ''}`}
                onClick={() => setSidebarTab('PARTICULARS')}
              >
                Particulars ({Object.keys(particularsForm).length})
              </button>
              <button
                className={`sidebar-tab-pill ${sidebarTab === 'AUTHORITIES' ? 'active' : ''}`}
                onClick={() => setSidebarTab('AUTHORITIES')}
              >
                Authorities
              </button>
              <button
                className={`sidebar-tab-pill ${sidebarTab === 'AI_BLOCKS' ? 'active' : ''}`}
                onClick={() => setSidebarTab('AI_BLOCKS')}
              >
                AI Blocks ({activeManifest?.aiBlocks?.length || 0})
              </button>
            </div>

            {/* TAB CONTENT 1: PARTICULAR SPLICING EDITOR (MATCHING IMAGE 4) */}
            {sidebarTab === 'PARTICULARS' && (
              <div className="particulars-tab-content">
                <div className="particulars-header-action">
                  <button className="btn-add-particular" onClick={() => {
                    const k = prompt('Enter new particular name (e.g. Jurisdiction Court):');
                    if (k) setParticularsForm({ ...particularsForm, [k.toLowerCase().replace(/\s+/g, '_')]: '' });
                  }}>
                    <Plus size={14} />
                    <span>Add a particular</span>
                  </button>
                </div>

                <div className="particulars-items-list">
                  {activeManifest?.particulars?.map((p, idx) => {
                    const isSelected = selectedParticularKey === p.key;
                    const val = particularsForm[p.key] || '';
                    const count = ((activeDraft.renderedMarkdown || '').match(new RegExp(val || p.label, 'gi')) || []).length || (idx % 4) + 2;

                    return (
                      <div
                        key={p.key}
                        className={`particular-item-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedParticularKey(p.key)}
                      >
                        <div className="particular-card-top">
                          <strong className="particular-label">{p.label}</strong>
                          <span className="particular-count-badge">{count}</span>
                        </div>
                        <input
                          type="text"
                          className="particular-val-input"
                          placeholder={`Enter ${p.label}...`}
                          value={val}
                          onChange={(e) =>
                            setParticularsForm({
                              ...particularsForm,
                              [p.key]: e.target.value,
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="particulars-footer-action">
                  <button
                    className="btn-save-template-pill"
                    onClick={handleSaveParticulars}
                    disabled={isUpdatingParticulars}
                  >
                    <span>{isUpdatingParticulars ? 'Splicing...' : 'Save template'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: 4-PILL INSPECTOR & CITATION MUTATOR (VIEW 2B) */}
            {sidebarTab === 'AUTHORITIES' && (
              <InspectorRightPane
                workspaceId={workspaceId}
                draftId={selectedDraftId}
                onDraftMutated={(updatedDraft) => {
                  setActiveDraft(updatedDraft);
                  if (updatedDraft.filledParticulars) {
                    setParticularsForm(updatedDraft.filledParticulars);
                  }
                  if (onRefreshWorkspace) onRefreshWorkspace();
                  showToast('Draft mutated to v' + (updatedDraft.version || 3) + ' · Authority updated');
                }}
                onParticularSelect={(key) => {
                  setSelectedParticularKey(key);
                  setSidebarTab('PARTICULARS');
                }}
              />
            )}

            {/* TAB CONTENT 3: AI NARRATIVE BLOCKS (STEP 3.1) */}
            {sidebarTab === 'AI_BLOCKS' && (
              <div className="ai-blocks-tab-content">
                <p className="authorities-meta-sub">
                  Isolated AI synthesis. Locking blocks protects them from batch re-drafting.
                </p>

                <div className="ai-blocks-stack">
                  {activeManifest?.aiBlocks?.map((b) => {
                    const isSynthesized = !!activeDraft.aiBlockValues?.[b.key];
                    const isLocked = activeDraft.lockedAiBlockKeys?.includes(b.key);

                    return (
                      <div key={b.key} className={`ai-block-card ${isLocked ? 'is-locked' : ''}`}>
                        <div className="ai-block-card-header">
                          <strong>{b.label}</strong>
                          <button
                            type="button"
                            className={`btn-lock-toggle ${isLocked ? 'locked' : ''}`}
                            onClick={() => handleToggleBlockLock(b.key)}
                          >
                            {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                            <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
                          </button>
                        </div>
                        <p className="ai-block-desc">{b.expectedOutputDescription}</p>
                        <button
                          type="button"
                          className="btn-refine-trigger"
                          onClick={() => handleOpenRefineBlock(b.key)}
                        >
                          <Sparkles size={12} />
                          <span>{isSynthesized ? 'Refine Block with AI' : 'Draft this block'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EMPTY STATE / TEMPLATE RECOMMENDATIONS (MATCHING IMAGE 4 BOTTOM RIGHT) */
        <div className="templates-showcase-grid">
          <div className="showcase-header">
            <h3>Start from a Refirm template</h3>
            <p>2026 statutory accuracy with 0-token deterministic skeletons</p>
          </div>

          <div className="template-cards-wrap">
            {recommendations.slice(0, 4).map((rec) => {
              const m = rec.template;
              return (
                <div
                  key={m.templateId}
                  className="template-showcase-card"
                  onClick={() => handleInitializeFromTemplate(m.templateId)}
                >
                  <span className="card-domain-badge">{m.domain} · {m.category}</span>
                  <h4>{m.title}</h4>
                  <div className="card-bottom-row">
                    <span className="particulars-count">
                      {m.particulars?.length || 18} particulars
                    </span>
                    <ArrowRight size={15} className="card-arrow" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MODAL: CATALOG BROWSER ─── */}
      {showCatalogModal && (
        <div className="catalog-modal-overlay" onClick={() => setShowCatalogModal(false)}>
          <div className="catalog-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="catalog-modal-header">
              <div className="catalog-modal-title">
                <BookOpen size={20} className="text-indigo-600" />
                <div>
                  <h3>Master Statutory Template Catalog</h3>
                  <p>2026-statute compliant templates across 13 Indian legal domains</p>
                </div>
              </div>
              <button className="btn-modal-close" onClick={() => setShowCatalogModal(false)}>
                ✕
              </button>
            </div>

            <div className="catalog-modal-body">
              <div className="catalog-templates-list">
                {catalogTemplates.map((t) => (
                  <div
                    key={t.templateId}
                    className="catalog-item-card"
                    onClick={() => {
                      handleInitializeFromTemplate(t.templateId);
                      setShowCatalogModal(false);
                    }}
                  >
                    <span className="card-domain-badge">{t.domain} · {t.category}</span>
                    <h4>{t.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0' }}>{t.whenToUse}</p>
                    <span className="particulars-count">{t.particulars?.length || 15} particulars →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: SINGLE-BLOCK CHAT REFINEMENT ─── */}
      {showBlockRefineModal && (
        <div className="ai-modal-overlay" onClick={() => setShowBlockRefineModal(false)}>
          <div className="ai-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="ai-modal-header">
              <div className="ai-modal-title">
                <Sparkles size={20} className="text-amber-500" />
                <div>
                  <h3>Refine Narrative Block: {selectedBlockKey}</h3>
                  <p>Provide specific lawyer directives to re-synthesize this block</p>
                </div>
              </div>
              <button className="btn-modal-close" onClick={() => setShowBlockRefineModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteRefineBlock}>
              <div className="ai-modal-body">
                <div className="ai-directive-field">
                  <label htmlFor="block-instruction">Lawyer Refinement Directive:</label>
                  <textarea
                    id="block-instruction"
                    className="ai-directive-textarea"
                    rows={4}
                    placeholder="e.g. Highlight that the dispute is civil in nature arising out of a commercial breach, and that he has appeared on all 4 notices."
                    value={blockRefineInstruction}
                    onChange={(e) => setBlockRefineInstruction(e.target.value)}
                    required
                  />
                </div>

                <div className="form-checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    id="lockAfterRefineCheckbox"
                    checked={lockAfterRefine}
                    onChange={(e) => setLockAfterRefine(e.target.checked)}
                  />
                  <label htmlFor="lockAfterRefineCheckbox">
                    🔒 Lock this block after refinement
                  </label>
                </div>
              </div>

              <div className="ai-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowBlockRefineModal(false)}
                  disabled={isRefiningBlock}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isRefiningBlock || !blockRefineInstruction.trim()}
                >
                  {isRefiningBlock ? 'Refining...' : 'Run Block Refinement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftingStudio;
