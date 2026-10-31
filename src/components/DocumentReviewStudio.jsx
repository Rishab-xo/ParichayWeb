import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
  Scale,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { getAuthorityDrawer, getDocumentSummary, submitWorkspacePrompt } from '../services/workspaceApi';
import '../styles/DocumentReviewStudio.css';

export const DocumentReviewStudio = ({
  workspace,
  document: docProp,
  initialSelectedDoc,
  onClose,
  onRefresh,
  onAskAssistant,
}) => {
  const doc = docProp || initialSelectedDoc;
  const workspaceId = doc?.workspaceId || workspace?.workspaceId;
  const docFileName = doc?.fileName || doc?.originalFilename || 'Uploaded Document';

  const [activeDimension, setActiveDimension] = useState('SUMMARY');
  const [activeFilterTab, setActiveFilterTab] = useState('STATUTES'); // 'STATUTES' | 'SECTIONS' | 'SOURCES'
  const [drawerData, setDrawerData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [errorDoc, setErrorDoc] = useState(null);

  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Document review initialized for **${docFileName}**. You can ask any legal or factual questions regarding this document's contents, obligations, dates, or identified risks.`,
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showRiskDetail, setShowRiskDetail] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch real document drawer and summary from backend
  useEffect(() => {
    if (!workspaceId || !doc?.documentId) return;

    let isMounted = true;
    setLoadingDoc(true);
    setErrorDoc(null);

    async function loadDocumentData() {
      try {
        const [drawer, summary] = await Promise.allSettled([
          getAuthorityDrawer(workspaceId, doc.documentId),
          getDocumentSummary(workspaceId, doc.documentId),
        ]);

        if (!isMounted) return;

        if (drawer.status === 'fulfilled' && drawer.value) {
          setDrawerData(drawer.value);
        }
        if (summary.status === 'fulfilled' && summary.value) {
          setSummaryData(summary.value);
        }
      } catch (err) {
        console.error('Error fetching document review data:', err);
        if (isMounted) {
          setErrorDoc('Unable to fetch detailed document analytics: ' + (err.message || 'Server error'));
        }
      } finally {
        if (isMounted) {
          setLoadingDoc(false);
        }
      }
    }

    loadDocumentData();
    return () => {
      isMounted = false;
    };
  }, [workspaceId, doc?.documentId]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isSending) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputQuestion.trim(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    const q = inputQuestion.trim();
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
            text: reply || 'I have analyzed the document regarding your query.',
          },
        ]);
      } else if (workspaceId) {
        const response = await submitWorkspacePrompt(workspaceId, {
          promptText: `Regarding uploaded document "${docFileName}": ${q}`,
          executionMode: 'REVIEW',
        });
        const answerText =
          response?.answerMarkdown ||
          response?.answer ||
          response?.content ||
          'Analysis processed against uploaded document.';
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: answerText,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            text: `Document analysis: No active workspace found to evaluate query "${q}".`,
          },
        ]);
      }
    } catch (err) {
      console.error('Document query error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `⚠️ Query error: ${err.message || 'Unable to analyze document.'}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyText = () => {
    let textToCopy = '';
    if (drawerData?.pages && drawerData.pages.length > 0) {
      textToCopy = drawerData.pages.map((p) => `--- Page ${p.pageNumber} ---\n${p.markdownText}`).join('\n\n');
    } else if (summaryData?.executiveGist) {
      textToCopy = summaryData.executiveGist;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const irac = drawerData?.irac || summaryData?.iracBrief;
  const pages = drawerData?.pages || [];
  const provisions = irac?.applicableProvisions || [];
  const issues = irac?.issuesFramed || [];
  const keyEntities = summaryData?.keyEntities || [];
  const importantDates = summaryData?.importantDates || [];
  const monetaryAmounts = summaryData?.monetaryAmounts || [];
  const flaggedRisks = summaryData?.flaggedRiskClauses || [];

  return (
    <div className="doc-review-container">
      {/* ─── LEFT PANE: CHAT WITH DOCUMENT ─── */}
      <div className="review-chat-pane">
        <div className="chat-messages-scroll">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`review-chat-msg ${msg.sender}`}>
              <div className="msg-bubble-row">
                {msg.sender === 'ai' && (
                  <div className="msg-ai-icon">
                    <Sparkles size={14} />
                  </div>
                )}
                <div className="msg-text-bubble">
                  <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="review-chat-msg ai">
              <div className="msg-bubble-row">
                <div className="msg-ai-icon animate-pulse">
                  <Sparkles size={14} />
                </div>
                <div className="msg-text-bubble">
                  <p style={{ margin: 0 }}>Analyzing document against statutory grounds...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat input bar */}
        <form className="review-chat-input-bar" onSubmit={handleSendChat}>
          <input
            type="text"
            placeholder="Ask a question about this document..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            className="btn-chat-send"
            disabled={!inputQuestion.trim() || isSending}
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* ─── CENTER PANE: DOCUMENT VIEWER ─── */}
      <div className="review-doc-pane">
        <div className="review-doc-topbar">
          <div className="doc-title-left">
            {onClose && (
              <button className="btn-tool-icon" onClick={onClose} title="Back">
                <X size={15} />
              </button>
            )}
            <FileText size={15} className="text-zinc-500" />
            <span className="doc-filename" title={docFileName}>
              {docFileName}
            </span>
          </div>

          <div className="doc-tools-right">
            <button className="btn-tool-icon" onClick={handleCopyText} title="Copy extracted text">
              {copied ? <CheckCircle2 size={15} className="text-emerald-500" /> : <Copy size={15} />}
            </button>
            {onRefresh && (
              <button className="btn-tool-icon" onClick={onRefresh} title="Refresh">
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="review-paper-scroll">
          <div className="review-paper-sheet">
            {loadingDoc ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#71717a' }}>
                <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '14px', fontWeight: 500 }}>Extracting document pages & OCR text...</p>
              </div>
            ) : errorDoc ? (
              <div style={{ padding: '30px', color: '#ef4444', textAlign: 'center' }}>
                <AlertTriangle size={24} style={{ margin: '0 auto 12px auto' }} />
                <p>{errorDoc}</p>
              </div>
            ) : pages.length > 0 ? (
              <div className="document-extracted-pages-list">
                {pages.map((page) => (
                  <div key={page.pageNumber} className="document-page-card" style={{ marginBottom: '32px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '8px',
                        marginBottom: '12px',
                        borderBottom: '1px solid #f4f4f5',
                        fontSize: '12px',
                        color: '#a1a1aa',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span>Page {page.pageNumber}</span>
                      <span>Extracted OCR</span>
                    </div>
                    <div
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        lineHeight: 1.7,
                        color: '#27272a',
                      }}
                    >
                      {page.markdownText}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="doc-type-indicator">
                  <FileText size={14} />
                  <span>{doc?.documentType || 'Uploaded Document'}</span>
                </div>

                <h3 className="doc-heading">{docFileName}</h3>

                {summaryData?.executiveGist ? (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#3f3f46', marginBottom: '8px' }}>
                      Executive Summary
                    </h4>
                    <p className="doc-para">{summaryData.executiveGist}</p>
                  </div>
                ) : null}

                {irac?.facts ? (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#3f3f46', marginBottom: '8px' }}>
                      Factual Overview
                    </h4>
                    <p className="doc-para">{irac.facts}</p>
                  </div>
                ) : null}

                {irac?.ratioDecidendi ? (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#3f3f46', marginBottom: '8px' }}>
                      Key Legal Grounds & Takeaways
                    </h4>
                    <p className="doc-para">{irac.ratioDecidendi}</p>
                  </div>
                ) : null}

                {!summaryData && !irac && (
                  <p className="doc-para" style={{ color: '#71717a' }}>
                    Document has been safely ingested and cataloged. Page-level extraction is being processed.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="review-doc-footer">
            <span>
              {pages.length > 0
                ? `${pages.length} page${pages.length > 1 ? 's' : ''} extracted`
                : 'Document Ingested'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANE: INSIGHTS & DIMENSIONS SIDEBAR ─── */}
      <div className="review-insights-pane">
        <div className="insights-header">
          <div className="insights-header-title">
            <h4>Insights</h4>
          </div>
          <p className="insights-subtitle">
            {provisions.length} provision{provisions.length !== 1 ? 's' : ''} · {keyEntities.length + monetaryAmounts.length} entities mapped
          </p>

          <div className="insights-tabs">
            <button
              className={`insights-tab-btn ${activeFilterTab === 'STATUTES' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('STATUTES')}
            >
              Statutes
            </button>
            <button
              className={`insights-tab-btn ${activeFilterTab === 'SECTIONS' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('SECTIONS')}
            >
              Sections
            </button>
            <button
              className={`insights-tab-btn ${activeFilterTab === 'SOURCES' ? 'active' : ''}`}
              onClick={() => setActiveFilterTab('SOURCES')}
            >
              Entities
            </button>
          </div>
        </div>

        {/* Tab 1 & 2: Statutes & Sections */}
        {(activeFilterTab === 'STATUTES' || activeFilterTab === 'SECTIONS') && (
          <div style={{ padding: '16px' }}>
            {provisions.length > 0 ? (
              <div className="statutory-remedy-cards">
                {provisions.map((prov, idx) => (
                  <div key={idx} className="remedy-card">
                    <div className="remedy-header">
                      <strong>{prov}</strong>
                      <ChevronRight size={13} className="remedy-arrow" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#71717a', margin: '8px 0' }}>
                No explicit statutory sections flagged in raw document text.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Entities & Dates & Amounts */}
        {activeFilterTab === 'SOURCES' && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {keyEntities.length > 0 && (
              <div>
                <strong style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>
                  Identified Entities
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {keyEntities.map((ent, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#f4f4f5',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: '#18181b',
                      }}
                    >
                      {ent}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {importantDates.length > 0 && (
              <div>
                <strong style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>
                  Important Dates
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {importantDates.map((dt, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#eff6ff',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: '#1e40af',
                      }}
                    >
                      {dt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {monetaryAmounts.length > 0 && (
              <div>
                <strong style={{ fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>
                  Monetary Amounts
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {monetaryAmounts.map((amt, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#ecfdf5',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: '#065f46',
                        fontWeight: 600,
                      }}
                    >
                      {amt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {keyEntities.length === 0 && importantDates.length === 0 && monetaryAmounts.length === 0 && (
              <p style={{ fontSize: '13px', color: '#71717a' }}>No structured entities cataloged yet.</p>
            )}
          </div>
        )}

        {/* Risk / Summary Callout */}
        {showRiskDetail && (irac?.ratioDecidendi || flaggedRisks.length > 0) && (
          <div className="risk-callout-card" style={{ margin: '16px' }}>
            <div className="risk-callout-header">
              <div className="risk-title-row">
                <AlertTriangle size={15} className="text-amber-500" />
                <strong>Key Takeaway & Risk Analysis</strong>
              </div>
              <button
                className="btn-risk-tool"
                onClick={() => setShowRiskDetail(!showRiskDetail)}
              >
                <ChevronUp size={14} />
              </button>
            </div>

            {irac?.ratioDecidendi && <p className="risk-desc">{irac.ratioDecidendi}</p>}

            {flaggedRisks.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                {flaggedRisks.map((risk, i) => (
                  <p key={i} style={{ fontSize: '12.5px', color: '#b45309', margin: '4px 0' }}>
                    • {risk}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Analysis Dimensions */}
        <div className="dimensions-list">
          {[
            { id: 'SUMMARY', label: 'Summary & Key Facts' },
            { id: 'ISSUES', label: 'Framed Issues & Claims' },
            { id: 'RISK_ASSESSMENT', label: 'Risk & Vulnerability Analysis', isHighlighted: true },
            { id: 'COMPLIANCE', label: 'Statutory Compliance Check' },
          ].map((dim) => (
            <button
              key={dim.id}
              className={`dimension-item-btn ${activeDimension === dim.id ? 'active' : ''} ${dim.isHighlighted ? 'highlighted' : ''}`}
              onClick={() => {
                setActiveDimension(dim.id);
                if (dim.id === 'RISK_ASSESSMENT') setShowRiskDetail(true);
              }}
            >
              <span>{dim.label}</span>
              {dim.isHighlighted && <ChevronRight size={14} className="text-purple-600" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentReviewStudio;
