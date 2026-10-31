import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  Gavel,
  Sparkles,
  ArrowUp,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Briefcase,
  Scale,
  RefreshCw,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Plus,
  Info,
} from 'lucide-react';
import { submitWorkspacePrompt, generateArgumentSheet, getArgumentSheet } from '../services/workspaceApi';
import '../styles/FreeArgumentsStudio.css';

// ─── LEGAL DOMAIN OPTIONS (13 domains — universal, no hardcoding) ───
const LEGAL_DOMAINS = [
  { value: 'TRADEMARK_IP', label: 'Trademark & Intellectual Property' },
  { value: 'CRIMINAL_DEFENSE', label: 'Criminal Law & Defence' },
  { value: 'INSOLVENCY_BANKRUPTCY', label: 'Insolvency & Bankruptcy (IBC)' },
  { value: 'CONSUMER_PROTECTION', label: 'Consumer Protection' },
  { value: 'PROPERTY_REAL_ESTATE', label: 'Property & Real Estate' },
  { value: 'FAMILY_MATRIMONIAL', label: 'Family & Matrimonial' },
  { value: 'LABOUR_EMPLOYMENT', label: 'Labour & Employment' },
  { value: 'CONSTITUTIONAL_WRIT', label: 'Constitutional & Writ' },
  { value: 'CORPORATE_COMMERCIAL', label: 'Corporate & Commercial' },
  { value: 'TAX_REVENUE', label: 'Tax & Revenue' },
  { value: 'CYBER_IT_LAW', label: 'Cyber & IT Law' },
  { value: 'ARBITRATION_ADR', label: 'Arbitration & ADR' },
  { value: 'GENERAL_CIVIL', label: 'General Civil Litigation' },
];

const PERSPECTIVES = [
  { value: 'CLAIMANT_PETITIONER', label: 'Claimant / Petitioner' },
  { value: 'OPPOSITE_PARTY_RESPONDENT', label: 'Opposite Party / Respondent' },
  { value: 'NEUTRAL_EVALUATOR', label: 'Neutral Evaluator' },
];

import { loadFreeArgSessions, saveFreeArgSessions, deleteFreeArgSession } from '../utils/freeArgsStorage';

// ─── MAIN COMPONENT ───
export const FreeArgumentsStudio = ({
  workspaces = [],
  activeSession = null,
  onSessionCreated,
  onNewSession,
}) => {

  // ─── PHASE: 'intake' | 'chat' ───
  const [phase, setPhase] = useState('intake');

  // ─── INTAKE FORM STATE ───
  const [matterTitle, setMatterTitle] = useState('');
  const [perspective, setPerspective] = useState('CLAIMANT_PETITIONER');
  const [legalDomain, setLegalDomain] = useState('GENERAL_CIVIL');
  const [linkedWorkspaceId, setLinkedWorkspaceId] = useState('');
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);

  // ─── CHAT SESSION STATE (isolated, never shared with workspace chat) ───
  const [sessionId, setSessionId] = useState(() => `freearg-${Date.now()}`);
  const [messages, setMessages] = useState([]);
  const [promptInput, setPromptInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sessionConfig, setSessionConfig] = useState(null);

  // ─── ARGUMENT SHEET STATE ───
  const [argSheet, setArgSheet] = useState(null);
  const [isGeneratingSheet, setIsGeneratingSheet] = useState(false);
  const [showArgSheet, setShowArgSheet] = useState(false);

  // ─── UI STATE ───
  const [toastMessage, setToastMessage] = useState(null);
  const messagesEndRef = useRef(null);

  // Sync activeSession prop changes
  useEffect(() => {
    if (activeSession && activeSession.sessionId) {
      setSessionId(activeSession.sessionId);
      setSessionConfig(activeSession);
      setMatterTitle(activeSession.matterTitle || '');
      setPerspective(activeSession.perspective || 'CLAIMANT_PETITIONER');
      setLegalDomain(activeSession.legalDomain || 'GENERAL_CIVIL');
      setLinkedWorkspaceId(activeSession.linkedWorkspaceId || '');

      // Load specific argument sheet if requested
      if (activeSession.sheet) {
        setArgSheet(activeSession.sheet);
        setShowArgSheet(true);
      } else if (activeSession.sheetId && activeSession.linkedWorkspaceId) {
        getArgumentSheet(activeSession.linkedWorkspaceId, activeSession.sheetId)
          .then((sheet) => {
            if (sheet) {
              setArgSheet(sheet);
              setShowArgSheet(true);
            }
          })
          .catch((err) => console.error('Failed to load argument sheet:', err));
      }

      try {
        const raw = localStorage.getItem(`refirm_freearg_msgs_${activeSession.sessionId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            setPhase('chat');
            return;
          }
        }
      } catch { /* ignore */ }
      setPhase('chat');
    } else if (!activeSession && phase === 'chat') {
      handleReset();
    }
  }, [activeSession?.sessionId, activeSession?.sheetId]);

  // Persist messages whenever they change
  useEffect(() => {
    const curId = sessionConfig?.sessionId || sessionId;
    if (curId && messages.length > 0) {
      try {
        localStorage.setItem(`refirm_freearg_msgs_${curId}`, JSON.stringify(messages));
      } catch { /* ignore */ }
    }
  }, [messages, sessionConfig?.sessionId, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showToast = (msg, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  // ─── INTAKE FORM SUBMIT ───
  const handleStartSession = (e) => {
    e.preventDefault();
    if (!matterTitle.trim()) return;

    const currentId = sessionId || `freearg-${Date.now()}`;
    const config = {
      sessionId: currentId,
      matterTitle: matterTitle.trim(),
      perspective,
      legalDomain,
      linkedWorkspaceId: linkedWorkspaceId || null,
      createdAt: new Date().toISOString(),
    };
    setSessionConfig(config);

    const linkedWs = workspaces.find((w) => w.workspaceId === linkedWorkspaceId);
    const contextNote = linkedWs
      ? `Linked to matter: **${linkedWs.title}**`
      : `Standalone session — no matter linked`;

    const welcomeMsg = {
      id: 'welcome',
      sender: 'assistant',
      sectionTitle: 'Arguments Studio Ready',
      text: `**${config.matterTitle}** argument session initialized.\n\n`
        + `- **Perspective:** \`${PERSPECTIVES.find(p => p.value === perspective)?.label}\`\n`
        + `- **Domain:** ${LEGAL_DOMAINS.find(d => d.value === legalDomain)?.label}\n`
        + `- ${contextNote}\n\n`
        + `Present any legal question, argument proposition, or adversary contention. `
        + `The AI will respond as institutional counsel grounded in Indian law, statutory provisions, and binding precedents.\n\n`
        + `When ready, use **Argument Sheet** to produce a full courtroom dossier${!linkedWorkspaceId ? ' (requires linking a matter)' : ''}.`,
      timestamp: 'Just now',
      expanded: true,
    };

    setMessages([welcomeMsg]);
    setPhase('chat');

    const existing = loadFreeArgSessions();
    const updated = [
      { ...config, preview: matterTitle.trim() },
      ...existing.filter((s) => s.sessionId !== currentId),
    ].slice(0, 20);
    saveFreeArgSessions(updated);
    onSessionCreated?.({ ...config, preview: matterTitle.trim() });
  };

  // ─── SEND MESSAGE ───
  const handleSend = async () => {
    if (!promptInput.trim() || isThinking) return;

    const userText = promptInput.trim();
    setPromptInput('');

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const domainLabel = LEGAL_DOMAINS.find((d) => d.value === sessionConfig?.legalDomain)?.label || '';
      const perspLabel = PERSPECTIVES.find((p) => p.value === sessionConfig?.perspective)?.label || '';
      const enrichedPrompt = `[Domain: ${domainLabel}] [Perspective: ${perspLabel}] [Matter: ${sessionConfig?.matterTitle}]\n\n${userText}`;

      const targetWsId = sessionConfig?.linkedWorkspaceId || null;
      const response = await submitWorkspacePrompt(targetWsId, {
        promptText: enrichedPrompt,
        executionMode: 'ARGUMENTS',
        responseLanguage: 'English',
        partyPerspective: sessionConfig?.perspective,
        temporary: !targetWsId,
      });

      // If a temporary or new workspace was created on the backend, update state so sheet generation works
      if (response?.workspaceId && !sessionConfig?.linkedWorkspaceId) {
        setSessionConfig((prev) => ({ ...prev, linkedWorkspaceId: response.workspaceId }));
        setLinkedWorkspaceId(response.workspaceId);
      }

      if (response?.createdArtifact?.artifactType === 'ARGUMENT_SHEET' && response?.createdArtifact?.artifactId) {
        const wsIdToFetch = response.workspaceId || targetWsId;
        if (wsIdToFetch) {
          getArgumentSheet(wsIdToFetch, response.createdArtifact.artifactId)
            .then((s) => {
              if (s) setArgSheet(s);
            })
            .catch(() => {});
        }
      }

      const answerText =
        response?.answerMarkdown ||
        response?.answer ||
        response?.content ||
        'Analysis processed. Please refine your question for more targeted guidance.';

      const assistMsg = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        sectionTitle: 'Courtroom Arguments & Bench Grill',
        text: answerText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        expanded: true,
        citations: response?.citations || [],
      };

      setMessages((prev) => [...prev, assistMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          sectionTitle: 'Notice',
          isError: true,
          text: `⚠️ **Unable to process:** ${err.message || 'Server error'}. Please verify the backend API is reachable.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          expanded: true,
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // ─── GENERATE ARGUMENT SHEET ───
  const handleGenerateSheet = async () => {
    const wsId = sessionConfig?.linkedWorkspaceId;
    if (!wsId) {
      showToast('Link a matter workspace to generate a full Argument Sheet.', 4000);
      return;
    }
    setIsGeneratingSheet(true);
    try {
      const sheet = await generateArgumentSheet(wsId, {
        partyPerspective: sessionConfig.perspective,
        customFocusInstruction: sessionConfig.matterTitle,
      });
      setArgSheet(sheet);
      setShowArgSheet(true);
      showToast('Argument Sheet generated successfully.');
    } catch (err) {
      showToast(`Failed to generate sheet: ${err.message}`, 4000);
    } finally {
      setIsGeneratingSheet(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard'));
  };

  const handleReset = () => {
    setPhase('intake');
    setMessages([]);
    setMatterTitle('');
    setPerspective('CLAIMANT_PETITIONER');
    setLegalDomain('GENERAL_CIVIL');
    setLinkedWorkspaceId('');
    setSessionConfig(null);
    setArgSheet(null);
    setShowArgSheet(false);
    setSessionId(`freearg-${Date.now()}`);
    onNewSession?.();
  };

  const linkedWs = workspaces.find((w) => w.workspaceId === linkedWorkspaceId);

  // ─── RENDER ───
  return (
    <div className="free-args-container">

      {toastMessage && (
        <div className="free-args-toast">
          <Sparkles size={13} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── PHASE 1: INTAKE FORM ─── */}
      {phase === 'intake' && (
        <div className="free-args-intake-wrapper">
          <div className="free-args-intake-card">
            <div className="free-args-intake-header">
              <div className="free-args-intake-icon-badge">
                <Scale size={22} strokeWidth={2} />
              </div>
              <div className="free-args-header-text">
                <div className="free-args-title-row">
                  <h2 className="free-args-intake-title">Courtroom Arguments Studio</h2>
                  <span className="free-args-badge-mode">Independent Brief</span>
                </div>
                <p className="free-args-intake-subtitle">
                  Formulate courtroom submissions, anticipate judicial grill questions, and build targeted statutory counter-rebuttals.
                </p>
              </div>
            </div>

            <form className="free-args-intake-form" onSubmit={handleStartSession}>

              <div className="free-args-field">
                <label className="free-args-label">
                  <FileText size={14} />
                  Argument Brief / Matter Title
                </label>
                <input
                  type="text"
                  className="free-args-input"
                  placeholder="e.g. Interim Injunction under Sec 9 or Bail Application in NDPS Matter"
                  value={matterTitle}
                  onChange={(e) => setMatterTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* 2-Column Responsive Row for Domain & Stance */}
              <div className="free-args-form-row">
                <div className="free-args-field">
                  <label className="free-args-label">
                    <Scale size={14} />
                    Legal Domain
                  </label>
                  <select
                    className="free-args-select"
                    value={legalDomain}
                    onChange={(e) => setLegalDomain(e.target.value)}
                  >
                    {LEGAL_DOMAINS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div className="free-args-field">
                  <label className="free-args-label">
                    <ShieldCheck size={14} />
                    Advocacy Stance
                  </label>
                  <div className="free-args-segmented-control">
                    {PERSPECTIVES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className={`segmented-btn ${perspective === p.value ? 'active' : ''}`}
                        onClick={() => setPerspective(p.value)}
                      >
                        {p.value === 'CLAIMANT_PETITIONER' ? 'Petitioner' : p.value === 'OPPOSITE_PARTY_RESPONDENT' ? 'Respondent' : 'Bench Grill'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="free-args-field">
                <label className="free-args-label">
                  <Briefcase size={14} />
                  Link an Existing Matter
                  <span className="free-args-label-optional"> (optional)</span>
                </label>
                <div className="free-args-link-matter-wrap">
                  <div
                    className="free-args-link-trigger"
                    onClick={() => setShowLinkDropdown((v) => !v)}
                  >
                    <Briefcase size={14} className="free-args-link-icon" />
                    <span className="free-args-link-label">
                      {linkedWs ? linkedWs.title : 'No matter linked — standalone session'}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`free-args-link-chevron ${showLinkDropdown ? 'rotated' : ''}`}
                    />
                  </div>
                  {showLinkDropdown && (
                    <div className="free-args-link-dropdown">
                      <div
                        className={`free-args-link-option ${!linkedWorkspaceId ? 'active' : ''}`}
                        onClick={() => { setLinkedWorkspaceId(''); setShowLinkDropdown(false); }}
                      >
                        <X size={13} />
                        No matter — standalone session
                      </div>
                      {workspaces.map((ws) => (
                        <div
                          key={ws.workspaceId}
                          className={`free-args-link-option ${linkedWorkspaceId === ws.workspaceId ? 'active' : ''}`}
                          onClick={() => { setLinkedWorkspaceId(ws.workspaceId); setShowLinkDropdown(false); }}
                        >
                          <Briefcase size={13} />
                          {ws.title || 'Untitled Matter'}
                        </div>
                      ))}
                      {workspaces.length === 0 && (
                        <div className="free-args-link-empty">No matters found. Create one first.</div>
                      )}
                    </div>
                  )}
                </div>

                {!linkedWorkspaceId ? (
                  <div className="free-args-info-box">
                    <Info size={14} />
                    <span>Standalone mode is active. Instant legal analysis and bench Q&A work immediately without saving to a case file.</span>
                  </div>
                ) : (
                  <div className="free-args-info-box linked-active">
                    <Briefcase size={14} />
                    <span>Linked to matter <strong>{linkedWs?.title}</strong>. Full statutory Argument Sheet generation is enabled.</span>
                  </div>
                )}
              </div>

              <button type="submit" className="free-args-start-btn" disabled={!matterTitle.trim()}>
                <Scale size={16} />
                <span>Initialize Arguments Studio</span>
                <ChevronRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── PHASE 2: CHAT ─── */}
      {phase === 'chat' && (
        <div className={`free-args-chat-layout ${showArgSheet ? 'split-view' : ''}`}>

          {/* LEFT: CHAT PANE */}
          <div className="free-args-chat-pane">

            <div className="free-args-chat-topbar">
              <div className="free-args-chat-topbar-left">
                <div className="free-args-chat-badge">
                  <Gavel size={14} />
                </div>
                <div>
                  <div className="free-args-chat-title">{sessionConfig?.matterTitle}</div>
                  <div className="free-args-chat-meta">
                    {LEGAL_DOMAINS.find((d) => d.value === sessionConfig?.legalDomain)?.label}
                    {' · '}
                    {PERSPECTIVES.find((p) => p.value === sessionConfig?.perspective)?.label}
                    {linkedWs ? ` · Linked: ${linkedWs.title}` : ' · Standalone'}
                  </div>
                </div>
              </div>
              <div className="free-args-chat-topbar-actions">
                <button
                  className={`free-args-btn-sheet ${!sessionConfig?.linkedWorkspaceId ? 'btn-sheet-dim' : ''}`}
                  onClick={handleGenerateSheet}
                  disabled={isGeneratingSheet}
                  title={!sessionConfig?.linkedWorkspaceId ? 'Link a matter to generate a full sheet' : 'Generate Courtroom Argument Sheet'}
                >
                  {isGeneratingSheet ? (
                    <RefreshCw size={14} className="spin-icon" />
                  ) : (
                    <Scale size={14} />
                  )}
                  <span>{isGeneratingSheet ? 'Generating...' : 'Argument Sheet'}</span>
                </button>

                <button
                  className="free-args-btn-reset"
                  onClick={handleReset}
                  title="Start a new argument session"
                >
                  <Plus size={14} />
                  <span>New</span>
                </button>
              </div>
            </div>

            <div className="free-args-messages">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`free-args-msg-row ${isUser ? 'user-row' : 'assistant-row'}`}
                  >
                    {isUser ? (
                      <div className="free-args-user-bubble">
                        <p>{msg.text}</p>
                      </div>
                    ) : (
                      <div className={`free-args-asst-card ${msg.isError ? 'error-card' : ''}`}>
                        <div className="free-args-asst-topbar">
                          <span className="free-args-asst-label">
                            {msg.isError ? (
                              <AlertTriangle size={13} className="text-red-500" />
                            ) : (
                              <Gavel size={13} />
                            )}
                            {msg.sectionTitle || 'Legal Analysis'}
                          </span>
                          <div className="free-args-asst-actions">
                            <span className="free-args-asst-ts">{msg.timestamp}</span>
                            <button
                              className="free-args-btn-icon"
                              onClick={() => handleCopy(msg.text)}
                              title="Copy"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              className="free-args-btn-icon"
                              onClick={() =>
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id ? { ...m, expanded: !m.expanded } : m
                                  )
                                )
                              }
                              title={msg.expanded ? 'Collapse' : 'Expand'}
                            >
                              {msg.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>
                        </div>

                        {msg.expanded && (
                          <div className="free-args-asst-body">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeSanitize]}
                            >
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {isThinking && (
                <div className="free-args-msg-row assistant-row">
                  <div className="free-args-asst-card thinking-state">
                    <div className="free-args-asst-topbar">
                      <span className="free-args-asst-label">
                        <Sparkles size={13} className="sparkle-anim" />
                        Analyzing statutory grounds...
                      </span>
                    </div>
                    <div className="free-args-thinking-dots">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="free-args-prompt-dock">
              <div className="free-args-dock-card">
                <textarea
                  rows={1}
                  className="free-args-dock-textarea"
                  placeholder="Present an argument, ask a legal question, or submit an adversary contention..."
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <div className="free-args-dock-actions">
                  <span className="free-args-dock-hint">Shift+Enter for new line</span>
                  <button
                    type="button"
                    className={`free-args-dock-send ${promptInput.trim() && !isThinking ? 'can-send' : ''}`}
                    onClick={handleSend}
                    disabled={!promptInput.trim() || isThinking}
                  >
                    <ArrowUp size={15} />
                  </button>
                </div>
              </div>
              <div className="free-args-dock-disclaimer">
                Refirm can make mistakes. Verify important statutory citations independently.
              </div>
            </div>
          </div>

          {/* RIGHT: ARGUMENT SHEET PANE */}
          {showArgSheet && argSheet && (
            <div className="free-args-sheet-pane">
              <div className="free-args-sheet-header">
                <div className="free-args-sheet-title-row">
                  <Scale size={16} />
                  <span>Courtroom Argument Sheet</span>
                </div>
                <div className="free-args-sheet-header-actions">
                  <button
                    className="free-args-btn-icon"
                    onClick={() => handleCopy(argSheet.markdownContent || '')}
                    title="Copy sheet"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="free-args-btn-icon"
                    onClick={() => setShowArgSheet(false)}
                    title="Close sheet"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div className="free-args-sheet-body">
                {argSheet.markdownContent ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                  >
                    {argSheet.markdownContent}
                  </ReactMarkdown>
                ) : (
                  <div className="free-args-sheet-empty">
                    <p>Argument sheet content unavailable. Try regenerating.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FreeArgumentsStudio;
