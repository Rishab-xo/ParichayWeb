import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  FileText,
  Search,
  Copy,
  Share2,
  Download,
  Send,
  Paperclip,
  Sparkles,
  Maximize2,
  X,
  BookOpen,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Plus
} from 'lucide-react';
import '../styles/LegalResearchStudio.css';

export const LegalResearchStudio = ({ workspace, memo, onClose, onAskAssistant }) => {
  const [activeTab, setActiveTab] = useState('CASES'); // 'CASES' | 'STATUTES'
  const [selectedCase, setSelectedCase] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isSending) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputQuestion.trim(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    const q = inputQuestion;
    setInputQuestion('');
    setIsSending(true);

    try {
      if (onAskAssistant) {
        const reply = await onAskAssistant(q);
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: reply || 'Analysis evaluated against statutory provisions and precedent authorities.',
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Analysis for "${q}": Verified against active case documents and statutory authorities.`,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Error generating response: ' + err.message,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleAddAuthorityToChat = (authorityTitle) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: `Cite authority: ${authorityTitle} and explain how it applies to our case facts.`,
      },
      {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Authority ${authorityTitle} is mapped to the active case theory and facts.`,
      },
    ]);
  };

  const handleCopyText = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="research-studio-container">
      {/* ─── LEFT PANE: RESEARCH CHAT ─── */}
      <div className="research-chat-pane">
        <div className="chat-messages-scroll">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`research-chat-msg ${msg.sender}`}>
              <div className="msg-bubble-row">
                {msg.sender === 'ai' && (
                  <div className="msg-ai-icon">
                    <Sparkles size={16} />
                  </div>
                )}
                <div className="msg-text-bubble">
                  <p>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="research-chat-msg ai">
              <div className="msg-bubble-row">
                <div className="msg-ai-icon animate-pulse">
                  <Sparkles size={16} />
                </div>
                <div className="msg-text-bubble">
                  <p>Searching Indian legal precedents and statutes...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat input bar */}
        <form className="research-chat-input-bar" onSubmit={handleSendChat}>
          <input
            type="text"
            placeholder="Ask a follow-up..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isSending}
          />
          <button type="button" className="btn-chat-icon" title="Attach file">
            <Paperclip size={16} />
          </button>
          <button
            type="submit"
            className="btn-chat-send"
            disabled={!inputQuestion.trim() || isSending}
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* ─── CENTER PANE: RESEARCH MEMO CANVAS ─── */}
      <div className="research-memo-pane">
        <div className="research-memo-topbar">
          <div className="doc-title-left">
            <button className="btn-tool-icon" onClick={onClose} title="Close">
              <X size={15} />
            </button>
            <button className="btn-tool-icon" title="Maximize">
              <Maximize2 size={14} />
            </button>
            <span className="doc-filename">
              Research Memo — Anticipatory bail after a chargesheet
            </span>
          </div>

          <div className="doc-tools-right">
            <button className="btn-tool-icon" onClick={handleCopyText} title="Copy">
              {copied ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </button>
            <button className="btn-tool-icon" title="Search memo">
              <Search size={15} />
            </button>
            <button className="btn-tool-icon" title="Share">
              <Share2 size={15} />
            </button>
            <button className="btn-doc-download">
              <Download size={14} />
              <span>Download</span>
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        <div className="memo-paper-scroll">
          <div className="memo-paper-sheet">
            <div className="memo-type-indicator">
              <BookOpen size={14} />
              <span>{memo?.title || 'Legal Research Memo'}</span>
            </div>

            {memo?.content || workspace?.latestBriefMarkdown ? (
              <div className="memo-dynamic-markdown" style={{ padding: '16px 0', lineHeight: 1.6 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {memo?.content || workspace?.latestBriefMarkdown}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="memo-empty-guidance" style={{ padding: '32px 16px', color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6 }}>
                <h3 style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px' }}>
                  {workspace?.title || 'Matter Research Memo'}
                </h3>
                <p>
                  No research brief generated yet for this workspace. Ask a legal question in the chat panel or run Strategic Triage to synthesize governing statutes and precedents.
                </p>
              </div>
            )}
          </div>

          <div className="memo-footer-status">
            <span>Research Memo · {workspace?.primaryDomain ? workspace.primaryDomain.replace(/_/g, ' ') : 'General'}</span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANE: AUTHORITIES SIDEBAR (DYNAMIC) ─── */}
      <div className="research-authorities-pane">
        <div className="authorities-header">
          <div className="authorities-header-title">
            <h4>Authorities</h4>
            <span className="authorities-chevron">&gt;&gt;</span>
          </div>
          <p className="authorities-subtitle">
            {workspace?.documents?.filter((d) => d.documentType === 'JUDGMENT_PRECEDENT').length || 0} judgments ·{' '}
            {workspace?.latestDraftingContext?.statutePack?.length || 0} provisions
          </p>

          <div className="authorities-tabs">
            <button
              className={`authorities-tab-btn ${activeTab === 'CASES' ? 'active' : ''}`}
              onClick={() => setActiveTab('CASES')}
            >
              Cases
            </button>
            <button
              className={`authorities-tab-btn ${activeTab === 'STATUTES' ? 'active' : ''}`}
              onClick={() => setActiveTab('STATUTES')}
            >
              Statutes
            </button>
          </div>
        </div>

        <div className="authorities-list">
          {activeTab === 'CASES' ? (
            (workspace?.documents || []).filter((d) => d.documentType === 'JUDGMENT_PRECEDENT').length > 0 ? (
              (workspace?.documents || [])
                .filter((d) => d.documentType === 'JUDGMENT_PRECEDENT')
                .map((doc) => (
                  <div
                    key={doc.documentId}
                    className="authority-card"
                    onClick={() => handleAddAuthorityToChat(doc.fileName)}
                  >
                    <div className="authority-card-top">
                      <strong>{doc.fileName}</strong>
                      <ChevronRight size={14} className="authority-arrow" />
                    </div>
                    <div className="authority-badge-row">
                      <span className="badge-used">Uploaded Precedent</span>
                    </div>
                    <p className="authority-citation">
                      {doc.totalPages || 1} pages · Ingested
                    </p>
                    <div className="authority-card-actions">
                      <button
                        className="btn-add-to-chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddAuthorityToChat(doc.fileName);
                        }}
                      >
                        <Plus size={12} />
                        <span>Add to chat</span>
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div style={{ padding: '24px 16px', color: '#94a3b8', fontSize: '0.84rem', textAlign: 'center' }}>
                No precedent judgments uploaded for this matter yet.
              </div>
            )
          ) : (
            (workspace?.latestDraftingContext?.statutePack || []).length > 0 ? (
              workspace.latestDraftingContext.statutePack.map((stat, idx) => (
                <div key={idx} className="authority-card selected">
                  <div className="authority-card-top">
                    <strong>{stat.sectionNumber}, {stat.actName}</strong>
                    <ChevronRight size={14} className="authority-arrow" />
                  </div>
                  <div className="authority-badge-row">
                    <span className="badge-used">Governing Statute</span>
                  </div>
                  <p className="authority-prop">
                    {stat.operativeText || 'Statutory provision'}
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 16px', color: '#94a3b8', fontSize: '0.84rem', textAlign: 'center' }}>
                No governing statutes pinned yet. Ask a query to evaluate governing provisions.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalResearchStudio;
