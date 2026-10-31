import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import WorkspacePage from './WorkspacePage';
import {
  Briefcase,
  Sparkles,
  Scale,
  ArrowRight,
  Search,
  FileText,
  Layers,
  Download,
  Copy,
  Check,
  Share2,
  ChevronRight,
  Play,
  Paperclip,
  ArrowUp,
  ExternalLink,
  ChevronDown,
  Plus,
  BookOpen,
  CheckCircle2,
  ChevronUp,
  Maximize2,
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  List,
  AlignLeft,
} from 'lucide-react';
import '../styles/Home.css';

export const Home = () => {
  const navigate = useNavigate();

  // Interactive state for preview widgets
  const [activeResearchTab, setActiveResearchTab] = useState('CASES');
  const [activeReviewFilter, setActiveReviewFilter] = useState('SECTIONS');
  const [activeCatalogTab, setActiveCatalogTab] = useState('REFIRM');
  const [selectedParticular, setSelectedParticular] = useState('address');
  const [copiedDraft, setCopiedDraft] = useState(false);

  const handleCopy = () => {
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="home-container">
      {/* ══════════════════════════════════════════════════════════════════════
          HERO HEADER: MINIMALIST BRAND & VALUE PROPOSITION
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-hero">
        <div className="hero-badge">
          <Scale size={14} />
          <span>BUILT FOR INDIAN ADVOCATES &amp; LITIGATION PRACTICES</span>
        </div>

        <h1 className="hero-main-title">
          The AI Legal Operating System<br />
          for Modern Advocates.
        </h1>

        <p className="hero-lead">
          From client instructions to court-ready legal drafts, case-grounded research, and verified
          courtroom arguments — backed by a strict zero-hallucination Authority Firewall.
        </p>

        <div className="hero-actions">
          <button className="btn-hero-dark" onClick={() => navigate('/workspaces')}>
            <Briefcase size={17} />
            <span>Open Workspace</span>
            <ArrowRight size={16} />
          </button>

          <button className="btn-hero-light" onClick={() => navigate('/intake')}>
            <Sparkles size={17} />
            <span>New AI Case Intake</span>
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 (IMAGE 5): BUILT TO KEEP MATTERS TOGETHER
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="showcase-section">
        <div className="showcase-layout">
          {/* Copy Column */}
          <div className="showcase-copy">
            <span className="section-eyebrow">BUILT TO KEEP MATTERS TOGETHER</span>
            <h2 className="section-heading">Files, chats and cases. One matter.</h2>
            <p className="section-body">
              Keep the work for a matter together, then come back later without piecing everything together again.
            </p>
            <div className="showcase-action-row">
              <button className="btn-pill-primary" onClick={() => navigate('/workspaces?tab=hub')}>
                <span>Open a matter</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Widget Column */}
          <div className="showcase-visual">
            {/* Top Floating Chat Preview Bubble */}
            <div className="floating-preview-chat-card">
              <div className="preview-chat-bubble-user">
                When is the next hearing, and is interim protection still on?
              </div>
              <div className="preview-chat-bubble-ai">
                <Sparkles size={16} className="text-purple-600 flex-shrink-0" />
                <span>Monday, 5 October, for arguments. Interim protection continues till then under the order of 17 September.</span>
              </div>
              <div className="preview-chat-input-pill">
                <div className="preview-badge-matter">
                  <Briefcase size={13} />
                  <span>Sharma v State</span>
                  <ChevronDown size={12} />
                </div>
                <span className="preview-placeholder-text">Describe your request...</span>
                <Paperclip size={16} className="text-gray-400" />
                <div className="preview-send-circle">
                  <ArrowUp size={14} />
                </div>
              </div>
            </div>

            {/* Matter Hub Main Card Replica */}
            <div className="showcase-card hub-card-replica" onClick={() => navigate('/workspaces?tab=hub')}>
              <div className="hub-replica-header">
                <div>
                  <h3 className="hub-replica-title">Sharma v State</h3>
                  <div className="hub-replica-sub">3 chats · 3 files</div>
                  <div className="hub-replica-desc">Anticipatory bail for Rohan Sharma. FIR 214/2026, Bandra police station.</div>
                </div>
                <button className="btn-pill-dark-sm">
                  <span>New chat with matter</span>
                </button>
              </div>

              {/* Court Cases Row */}
              <div className="hub-replica-section">
                <div className="hub-replica-section-header">
                  <span>Court cases</span>
                  <span className="count-badge">1</span>
                </div>
                <div className="replica-case-row">
                  <div>
                    <div className="replica-case-title">Rohan Sharma v. State of Maharashtra</div>
                    <div className="replica-case-forum">ABA 1184/2026 · City Civil and Sessions Court, Greater Bombay</div>
                  </div>
                  <div className="replica-case-status">
                    <span className="hearing-date">Next 5 Oct <span className="text-gray-400 font-normal">(In 13 days)</span></span>
                    <span className="status-pill-emerald">Pending</span>
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Chats & Files */}
              <div className="hub-replica-grid">
                <div className="hub-replica-col">
                  <div className="hub-replica-section-header">
                    <span>Chats</span>
                    <span className="count-badge">3</span>
                  </div>
                  <div className="replica-list-card">
                    <div className="replica-list-item" onClick={() => navigate('/workspaces?tab=drafting')}>
                      <div className="item-title">Anticipatory bail application</div>
                      <div className="item-meta">Draft · 22 Sep 2026</div>
                    </div>
                    <div className="replica-list-item" onClick={() => navigate('/workspaces?tab=research')}>
                      <div className="item-title">Anticipatory bail after chargesheet</div>
                      <div className="item-meta">Research · 22 Sep 2026</div>
                    </div>
                    <div className="replica-list-item" onClick={() => navigate('/workspaces?tab=review')}>
                      <div className="item-title">Review of FIR 214/2026</div>
                      <div className="item-meta">Review · 21 Sep 2026</div>
                    </div>
                  </div>
                </div>

                <div className="hub-replica-col">
                  <div className="hub-replica-section-header">
                    <span>Files</span>
                    <span className="count-badge">3</span>
                  </div>
                  <div className="replica-list-card">
                    <div className="replica-list-item" onClick={() => navigate('/workspaces?tab=review')}>
                      <div className="item-title">FIR 214-2026.pdf</div>
                      <div className="item-meta">1.2 MB · 21 Sep 2026</div>
                    </div>
                    <div className="replica-list-item" onClick={() => navigate('/workspaces?tab=review')}>
                      <div className="item-title">Complainant email trail.pdf</div>
                      <div className="item-meta">640 KB · 21 Sep 2026</div>
                    </div>
                    <div className="replica-list-item" onClick={() => navigate('/workspaces?tab=review')}>
                      <div className="item-title">Order dated 17-09-2026.pdf</div>
                      <div className="item-meta">210 KB · 18 Sep 2026</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 (IMAGE 1): BUILT TO DRAFT
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="showcase-section">
        <div className="showcase-layout">
          {/* Copy Column */}
          <div className="showcase-copy">
            <span className="section-eyebrow">BUILT TO DRAFT</span>
            <h2 className="section-heading">From instructions to a working legal draft.</h2>
            <p className="section-body">
              Tell Refirm what you need. Start with the draft, then keep shaping it until it says exactly what you want it to.
            </p>
            <div className="showcase-action-row">
              <button className="btn-pill-primary" onClick={() => navigate('/workspaces?tab=drafting')}>
                <span>Start drafting</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Visual Column */}
          <div className="showcase-visual">
            {/* Top Floating "Edit with AI" Popover */}
            <div className="floating-edit-ai-card">
              <div className="edit-ai-pills-row">
                <span className="edit-pill">Make formal</span>
                <span className="edit-pill">Shorten</span>
                <span className="edit-pill">Make stronger</span>
                <span className="edit-pill">Rewrite</span>
                <span className="edit-pill active">Ask Refirm</span>
              </div>
              <div className="edit-ai-input-row">
                <input
                  type="text"
                  className="edit-ai-input"
                  readOnly
                  value="Add that he joined on 2 September"
                />
                <button className="btn-apply-black">Apply</button>
              </div>
              <div className="edit-ai-snippet">
                2. <span className="chip-purple">The Applicant has appeared before the investigating officer on each occasion he was called and has produced every document sought. There is no allegation that he has tampered with evidence or influenced any witness.</span>
              </div>
              <div className="edit-ai-footer-note">
                <strong>Edit with AI.</strong> Select any part of the document to make it formal, shorten it, make it stronger or rewrite it, or ask Refirm for exactly the change you want.
              </div>
            </div>

            {/* Split Drafting Workspace Replica */}
            <div className="showcase-card drafting-replica-card">
              {/* Left Chat Pane */}
              <div className="replica-chat-pane">
                <div className="preview-chat-bubble-user" style={{ maxWidth: '100%' }}>
                  Draft an anticipatory bail application under Section 482 BNSS for Rohan Sharma. FIR 214/2026, Bandra police station, under Sections 318(4) and 61(2) BNS. A chargesheet was filed on 12 August. The dispute is a failed business deal; he has cooperated and appeared when asked.
                </div>
                <div className="preview-chat-bubble-ai" style={{ maxWidth: '100%', marginTop: '12px' }}>
                  <Sparkles size={16} className="text-purple-600 flex-shrink-0" />
                  <span>Draft ready. Paragraph 3 relies on the Supreme Court's ruling that a chargesheet does not bar anticipatory bail.</span>
                </div>
                <div className="preview-chat-input-pill" style={{ marginTop: 'auto' }}>
                  <span className="preview-placeholder-text">Ask a follow-up...</span>
                  <Paperclip size={16} className="text-gray-400" />
                  <div className="preview-send-circle">
                    <ArrowUp size={14} />
                  </div>
                </div>
              </div>

              {/* Center Document Paper Editor */}
              <div className="replica-paper-pane">
                <div className="replica-paper-top-bar">
                  <div className="paper-title-tag">
                    <span className="text-gray-400 mr-1">× ⤢</span>
                    <span>Anticipatory Bail Application — Rohan Sharma v3</span>
                    <ChevronDown size={13} className="ml-1 text-gray-500" />
                  </div>
                  <div className="paper-top-actions">
                    <button className="icon-btn-minimal"><Copy size={13} /></button>
                    <button className="icon-btn-minimal"><Search size={13} /></button>
                    <button className="icon-btn-minimal"><Share2 size={13} /></button>
                    <button className="btn-download-pill"><Download size={13} /> Download <ChevronDown size={11} /></button>
                  </div>
                </div>

                <div className="replica-formatting-toolbar">
                  <span className="fmt-btn font-bold">B</span>
                  <span className="fmt-btn italic">I</span>
                  <span className="fmt-btn underline">U</span>
                  <span className="fmt-btn line-through">S</span>
                  <span className="fmt-btn font-semibold">H1</span>
                  <span className="fmt-btn">≡</span>
                  <span className="fmt-btn">≡</span>
                  <span className="authorities-pill ml-auto">Authorities</span>
                </div>

                <div className="replica-legal-paper">
                  <div className="court-heading">IN THE COURT OF SESSIONS FOR GREATER BOMBAY AT MUMBAI</div>
                  <div className="court-case-number">Anticipatory Bail Application No. ___ of 2026</div>
                  <div className="court-subject">
                    ANTICIPATORY BAIL APPLICATION UNDER SECTION 482 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023
                  </div>

                  <div className="parties-line">Rohan Sharma ... Applicant</div>
                  <div className="versus-line">versus</div>
                  <div className="parties-line">State of Maharashtra ... Respondent</div>

                  <div className="submits-as-under">The Applicant respectfully submits as under:</div>

                  <div className="legal-para">
                    1. The Applicant apprehends arrest in connection with FIR No. 214 of 2026 registered at Bandra Police Station, arising out of a commercial transaction between the Applicant and the complainant that did not proceed as planned.
                  </div>

                  <div className="legal-para">
                    2. The Applicant has appeared before the investigating officer on each occasion he was called and has produced every document sought. There is no allegation that he has tampered with evidence or influenced any witness.
                  </div>

                  <div className="paper-footer-bar">
                    <span>Bail Application · Saved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 (IMAGE 2): BUILT TO FIND THE LAW
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="showcase-section">
        <div className="showcase-layout">
          {/* Copy Column */}
          <div className="showcase-copy">
            {/* Top Floating Precedent Card */}
            <div className="floating-precedent-card">
              <div className="precedent-card-top">
                <span className="case-name">Sushila Aggarwal v. State (NCT of Delhi)</span>
                <ChevronDown size={14} className="text-gray-400" />
              </div>
              <span className="badge-used-memo">Used in memo</span>
              <div className="precedent-citation">Supreme Court of India · 29 Jan 2020 · (2020) 5 SCC 1</div>
              <div className="precedent-label">Key legal proposition</div>
              <div className="precedent-text">
                The life of an anticipatory bail order does not end when the accused is summoned or charges are framed; it can continue till the end of the trial.
              </div>
              <div className="precedent-action-row">
                <button className="btn-add-to-chat">Add to chat</button>
                <span className="text-gray-400 text-sm ml-2">···</span>
              </div>
            </div>

            <span className="section-eyebrow">BUILT TO FIND THE LAW</span>
            <h2 className="section-heading">Ask the question. See the law behind the answer.</h2>
            <p className="section-body">
              Research Indian law, find relevant judgments and follow the answer back to the authority it came from.
            </p>
            <div className="showcase-action-row">
              <button className="btn-pill-primary" onClick={() => navigate('/workspaces?tab=research')}>
                <span>Start researching</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Visual Column */}
          <div className="showcase-visual">
            <div className="showcase-card research-replica-card">
              {/* Left Chat Pane */}
              <div className="replica-chat-pane">
                <div className="preview-chat-bubble-user" style={{ maxWidth: '100%' }}>
                  Can anticipatory bail be granted after a chargesheet has been filed?
                </div>
                <div className="preview-chat-bubble-ai" style={{ maxWidth: '100%', marginTop: '12px' }}>
                  <Sparkles size={16} className="text-purple-600 flex-shrink-0" />
                  <span>Yes. A chargesheet does not bar anticipatory bail; the memo sets out the position and the two Supreme Court judgments behind it.</span>
                </div>
                <div className="preview-chat-input-pill" style={{ marginTop: 'auto' }}>
                  <span className="preview-placeholder-text">Ask a follow-up...</span>
                  <Paperclip size={16} className="text-gray-400" />
                  <div className="preview-send-circle">
                    <ArrowUp size={14} />
                  </div>
                </div>
              </div>

              {/* Center Memo Pane */}
              <div className="replica-memo-pane">
                <div className="replica-paper-top-bar">
                  <div className="paper-title-tag">
                    <span className="text-gray-400 mr-1">× ⤢</span>
                    <span>Research Memo — Anticipatory bail after a chargesheet</span>
                  </div>
                  <div className="paper-top-actions">
                    <button className="icon-btn-minimal"><Copy size={13} /></button>
                    <button className="icon-btn-minimal"><Search size={13} /></button>
                    <button className="icon-btn-minimal"><Share2 size={13} /></button>
                    <button className="btn-download-pill"><Download size={13} /> Download <ChevronDown size={11} /></button>
                  </div>
                </div>

                <div className="memo-content-scroll">
                  <div className="memo-breadcrumb">
                    <BookOpen size={13} />
                    <span>Research Memo</span>
                  </div>

                  <p className="memo-para">
                    <strong>Short answer.</strong> Yes. The filing of a chargesheet, or the court taking cognizance, does not by itself bar an application for anticipatory bail. The court still decides the application on its merits.
                  </p>

                  <p className="memo-para">
                    <strong>The position.</strong> Section 482 of the BNSS carries forward the power in Section 438 CrPC. In Bharat Chaudhary v. State of Bihar the Supreme Court found no restriction in that provision on granting anticipatory bail in a suitable case even when cognizance has been taken or a chargesheet has been filed.
                  </p>

                  <p className="memo-para">
                    <strong>How long it lasts.</strong> A Constitution Bench held in Sushila Aggarwal v. State (NCT of Delhi) that <mark className="hl-yellow">the protection need not be limited to a fixed period and can continue till the end of the trial</mark>, unless the court finds reason to limit it.
                  </p>

                  <div className="paper-footer-bar">
                    <span>Research Memo · Read-only</span>
                  </div>
                </div>
              </div>

              {/* Right Authorities Sidebar */}
              <div className="replica-authorities-sidebar">
                <div className="authorities-sidebar-header">
                  <span className="font-bold text-gray-900">Authorities</span>
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
                <div className="authorities-stats">2 judgments · 1 provision cited</div>

                <div className="authorities-tabs-pills">
                  <button
                    className={`tab-pill-sm ${activeResearchTab === 'CASES' ? 'active' : ''}`}
                    onClick={() => setActiveResearchTab('CASES')}
                  >
                    Cases
                  </button>
                  <button
                    className={`tab-pill-sm ${activeResearchTab === 'STATUTES' ? 'active' : ''}`}
                    onClick={() => setActiveResearchTab('STATUTES')}
                  >
                    Statutes
                  </button>
                </div>

                <div className="authority-card-item active-card">
                  <div className="auth-card-title">Sushila Aggarwal v. State (NCT of Delhi) <ChevronRight size={13} /></div>
                  <span className="badge-used-memo">Used in memo</span>
                  <div className="auth-card-meta">Supreme Court of India · 29 Jan 2020 · (2020) 5 SCC 1</div>
                  <div className="auth-card-gist">
                    Anticipatory bail need not be limited to a fixed period; it can continue till the end of the trial unless special...
                  </div>
                </div>

                <div className="authority-card-item">
                  <div className="auth-card-title">Bharat Chaudhary v. State of Bihar <ChevronRight size={13} /></div>
                  <span className="badge-used-memo">Used in memo</span>
                  <div className="auth-card-meta">Supreme Court of India · 8 Oct 2003 · (2003) 8 SCC 77</div>
                  <div className="auth-card-gist">
                    Section 438 CrPC places no restriction on granting anticipatory bail even after cognizance is taken or a...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 (IMAGE 3): BUILT TO UNDERSTAND DOCUMENTS
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="showcase-section">
        <div className="showcase-layout">
          {/* Copy Column */}
          <div className="showcase-copy">
            <span className="section-eyebrow">BUILT TO UNDERSTAND DOCUMENTS</span>
            <h2 className="section-heading">See what deserves a closer look.</h2>
            <p className="section-body">
              Give Refirm a legal document and work through the important parts alongside the document itself.
            </p>
            <div className="showcase-action-row">
              <button className="btn-pill-primary" onClick={() => navigate('/workspaces?tab=review')}>
                <span>Start a review</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Floating Risk Assessment Inset Card */}
            <div className="floating-risk-card">
              <div className="risk-card-header">
                <span className="font-bold text-gray-900">Risk Assessment</span>
                <div className="flex items-center gap-2 text-gray-400">
                  <Copy size={13} />
                  <ChevronUp size={14} />
                </div>
              </div>
              <p className="risk-card-text">
                <strong>Interest on delayed payment is not provided for.</strong> Clause 7 fixes payment at 30 days from invoice but provides no contractual rate and no consequence for delay. There is no default rate and no cross-reference to a schedule.
              </p>
              <div className="risk-statutory-grid">
                <div className="statute-box">
                  <div className="statute-box-title">Section 61 <span className="font-normal text-gray-500">Sale of Goods Act, 1930</span> <ChevronRight size={12} /></div>
                  <div className="statute-box-desc">Interest by way of damages and special damages</div>
                </div>
                <div className="statute-box">
                  <div className="statute-box-title">Section 3 <span className="font-normal text-gray-500">Interest Act, 1978</span> <ChevronRight size={12} /></div>
                  <div className="statute-box-desc">Power of court to allow interest</div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Column */}
          <div className="showcase-visual">
            <div className="showcase-card review-replica-card">
              {/* Left Chat Pane */}
              <div className="replica-chat-pane">
                <div className="file-attachment-pill">
                  <FileText size={14} className="text-gray-500" />
                  <span className="truncate">Commercial-Services-Contract...</span>
                  <span className="file-tag">File</span>
                </div>
                <div className="preview-chat-bubble-user" style={{ maxWidth: '100%', marginTop: '8px' }}>
                  Review this commercial contract before we issue a recovery notice. Flag anything that weakens our position on the unpaid invoices.
                </div>
                <div className="preview-chat-bubble-ai" style={{ maxWidth: '100%', marginTop: '12px' }}>
                  <Sparkles size={16} className="text-purple-600 flex-shrink-0" />
                  <span>Review complete. The agreement has no contractual rate for delayed payment and contains conflicting dispute-resolution provisions.</span>
                </div>
                <div className="preview-chat-input-pill" style={{ marginTop: 'auto' }}>
                  <span className="preview-placeholder-text">Ask a follow-up...</span>
                  <Paperclip size={16} className="text-gray-400" />
                  <div className="preview-send-circle">
                    <ArrowUp size={14} />
                  </div>
                </div>
              </div>

              {/* Center Document Paper */}
              <div className="replica-memo-pane">
                <div className="replica-paper-top-bar">
                  <div className="paper-title-tag">
                    <span className="text-gray-400 mr-1">× ⤢</span>
                    <span>Commercial-Services-Contract-2026.pdf</span>
                  </div>
                  <div className="paper-top-actions">
                    <button className="icon-btn-minimal"><Copy size={13} /></button>
                    <button className="icon-btn-minimal"><Search size={13} /></button>
                    <button className="icon-btn-minimal"><Share2 size={13} /></button>
                    <button className="btn-download-pill"><Download size={13} /> Download <ChevronDown size={11} /></button>
                  </div>
                </div>

                <div className="memo-content-scroll">
                  <div className="memo-breadcrumb">
                    <BookOpen size={13} />
                    <span>Document</span>
                  </div>

                  <div className="doc-center-title">COMMERCIAL SERVICE AGREEMENT</div>
                  <div className="doc-opening-line">
                    This Agreement is made on 3 March 2026 between Prime Logistics Solutions Ltd (the "Supplier") and Metro Retailers (the "Buyer").
                  </div>

                  <div className="doc-clause">
                    <strong>6. Inspection.</strong> The Buyer shall inspect the Goods on delivery and notify any shortfall or defect in writing within seven (7) days, failing which the Goods shall be deemed accepted.
                  </div>

                  <div className="doc-clause">
                    <strong>7. Payment.</strong> <mark className="hl-yellow">The Buyer shall pay each invoice within 30 days of invoice, by bank transfer to the account notified by the Supplier in writing.</mark>
                  </div>

                  <div className="doc-clause">
                    <strong>8. Taxes.</strong> Prices are exclusive of GST, which shall be charged at the applicable rate and paid by the Buyer together with the invoice.
                  </div>

                  <div className="doc-clause">
                    <strong>9. Quality.</strong> All Goods shall conform to the specifications and be inspected in accordance with the procedure set out in Schedule III.
                  </div>

                  <div className="paper-footer-bar">
                    <span>PDF · 14 pages · Reviewed</span>
                  </div>
                </div>
              </div>

              {/* Right Insights Sidebar */}
              <div className="replica-authorities-sidebar">
                <div className="authorities-sidebar-header">
                  <span className="font-bold text-gray-900">Insights</span>
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
                <div className="authorities-stats">10 dimensions · 5 provisions cited</div>

                <div className="authorities-tabs-pills">
                  <button
                    className={`tab-pill-sm ${activeReviewFilter === 'STATUTES' ? 'active' : ''}`}
                    onClick={() => setActiveReviewFilter('STATUTES')}
                  >
                    Statutes
                  </button>
                  <button
                    className={`tab-pill-sm ${activeReviewFilter === 'SECTIONS' ? 'active' : ''}`}
                    onClick={() => setActiveReviewFilter('SECTIONS')}
                  >
                    Sections
                  </button>
                  <button
                    className={`tab-pill-sm ${activeReviewFilter === 'SOURCES' ? 'active' : ''}`}
                    onClick={() => setActiveReviewFilter('SOURCES')}
                  >
                    Sources
                  </button>
                </div>

                <div className="insights-dimensions-list">
                  <div className="dimension-item">Final Summary and Recommendation</div>
                  <div className="dimension-item">Commercial Review Analysis</div>
                  <div className="dimension-item">Legal Review and Compliance</div>
                  <div className="dimension-item">Pros and Cons Analysis</div>
                  <div className="dimension-item active-purple">Risk Assessment</div>
                  <div className="dimension-item">Clause Accuracy and Consistency</div>
                  <div className="dimension-item">Grammar and Language Review</div>
                  <div className="dimension-item">Formatting and Structure Audit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 (IMAGE 4): BUILT TO REUSE YOUR BEST WORK
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="showcase-section">
        <div className="showcase-layout">
          {/* Visual Column (Editor on Left) */}
          <div className="showcase-visual">
            <div className="showcase-card template-splicing-card">
              {/* Left Paper Editor with Particular Chips */}
              <div className="replica-paper-pane" style={{ borderRight: '1px solid #e5e7eb' }}>
                <div className="replica-paper-top-bar">
                  <div className="paper-title-tag">
                    <span className="text-gray-400 mr-1">×</span>
                    <span>My Template 1</span>
                  </div>
                </div>

                <div className="replica-formatting-toolbar">
                  <span className="fmt-btn font-bold">B</span>
                  <span className="fmt-btn italic">I</span>
                  <span className="fmt-btn underline">U</span>
                  <span className="fmt-btn line-through">S</span>
                  <span className="fmt-btn">≡</span>
                  <span className="fmt-btn">≡</span>
                  <span className="fmt-btn">≡</span>
                </div>

                <div className="replica-legal-paper">
                  <div className="court-heading" style={{ marginBottom: '14px' }}>AGREEMENT FOR SALE</div>

                  <p className="legal-para">
                    This Agreement for Sale is made at Mumbai on <span className="chip-purple">14 August 2026</span> between <span className="chip-purple">Anil Mehta</span> (the "Seller") and <span className="chip-purple">Priya Nair</span> (the "Buyer").
                  </p>

                  <p className="legal-para">
                    The Seller agrees to sell, and the Buyer agrees to purchase, the flat at <span className="chip-purple">Flat 1204, Sea Breeze CHS, Bandra (West), Mumbai 400050</span> for a total consideration of <span className="chip-purple">₹2,40,00,000</span>, payable as set out below.
                  </p>

                  <p className="legal-para">
                    1. The Buyer shall pay <span className="chip-purple">₹24,00,000</span> to the Seller on the execution of this Agreement, and the balance of the consideration on or before the date of registration of the conveyance.
                  </p>

                  <p className="legal-para">
                    2. <span className="chip-purple">Anil Mehta</span> declares that the flat at <span className="chip-purple">Flat 1204, Sea Breeze CHS, Bandra (West), Mumbai 400050</span> is free from all encumbrances, charges, liens and claims, and that he has a clear and marketable title to it.
                  </p>
                </div>
              </div>

              {/* Right Particulars Sidebar */}
              <div className="particulars-editor-sidebar">
                <div className="font-bold text-gray-900 text-sm mb-3">Particulars</div>
                <button className="btn-add-particular mb-3">
                  <Plus size={13} /> Add a particular
                </button>

                <div className="particulars-items-scroll">
                  <div className="particular-item">
                    <div className="particular-row-header">
                      <span>Seller Name</span>
                      <span className="count-badge">6</span>
                    </div>
                    <div className="particular-val-text">Anil Mehta</div>
                  </div>

                  <div className="particular-item">
                    <div className="particular-row-header">
                      <span>Buyer Name</span>
                      <span className="count-badge">5</span>
                    </div>
                    <div className="particular-val-text">Priya Nair</div>
                  </div>

                  <div className="particular-item active-purple-card">
                    <div className="particular-row-header">
                      <span>Property Address</span>
                      <span className="count-badge">3</span>
                      <span className="text-gray-400 ml-auto">···</span>
                    </div>
                    <div className="particular-val-text">Flat 1204, Sea Breeze CHS, Bandra (W...</div>
                  </div>

                  <div className="particular-item">
                    <div className="particular-row-header">
                      <span>Consideration</span>
                      <span className="count-badge">2</span>
                    </div>
                    <div className="particular-val-text">₹2,40,00,000</div>
                  </div>

                  <div className="particular-item">
                    <div className="particular-row-header">
                      <span>Execution Date</span>
                      <span className="count-badge">2</span>
                    </div>
                    <div className="particular-val-text">14 August 2026</div>
                  </div>

                  <div className="particular-item">
                    <div className="particular-row-header">
                      <span>Earnest Money</span>
                      <span className="count-badge">2</span>
                    </div>
                    <div className="particular-val-text">₹24,00,000</div>
                  </div>
                </div>

                <button className="btn-save-template-black">Save template</button>
              </div>
            </div>
          </div>

          {/* Copy Column (Right) */}
          <div className="showcase-copy">
            <span className="section-eyebrow">BUILT TO REUSE YOUR BEST WORK</span>
            <h2 className="section-heading">Use ours. Make yours reusable.</h2>
            <p className="section-body">
              Start from a Refirm template, or turn the documents your practice already relies on into something you can use again and again.
            </p>
            <div className="showcase-action-row">
              <button className="btn-pill-primary" onClick={() => navigate('/workspaces?tab=drafting')}>
                <span>Start from a template</span>
                <ArrowRight size={16} />
              </button>
              <button className="btn-pill-secondary">
                <Play size={13} fill="currentColor" />
                <span>Watch how it works</span>
              </button>
            </div>

            {/* Floating Template Catalog Card */}
            <div className="floating-catalog-card">
              <div className="catalog-tabs-row">
                <button
                  className={`catalog-tab-pill ${activeCatalogTab === 'REFIRM' ? 'active' : ''}`}
                  onClick={() => setActiveCatalogTab('REFIRM')}
                >
                  Refirm Templates <span className="catalog-count">132</span>
                </button>
                <button
                  className={`catalog-tab-pill ${activeCatalogTab === 'MY' ? 'active' : ''}`}
                  onClick={() => setActiveCatalogTab('MY')}
                >
                  My Templates
                </button>
              </div>

              <div className="catalog-card-list">
                <div className="catalog-row-item" onClick={() => navigate('/workspaces?tab=drafting')}>
                  <div>
                    <div className="catalog-cat-tag">CRIMINAL · BAIL</div>
                    <div className="catalog-item-title">Anticipatory Bail Petition under Section 482 BNSS</div>
                    <div className="catalog-item-particulars">19 particulars</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

                <div className="catalog-row-item" onClick={() => navigate('/workspaces?tab=drafting')}>
                  <div>
                    <div className="catalog-cat-tag">NOTICES · GENERAL</div>
                    <div className="catalog-item-title">Legal Notice — General Demand / Breach</div>
                    <div className="catalog-item-particulars">23 particulars</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM BANNER: INSTANT CALL TO ACTION
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="home-footer-cta">
        <h2 className="footer-cta-title">Ready to elevate your legal practice?</h2>
        <p className="footer-cta-sub">
          Start with client intake, generate court-grounded drafts, or explore verified case precedents today.
        </p>
        <div className="hero-actions">
          <button className="btn-hero-dark" onClick={() => navigate('/workspaces?tab=hub')}>
            <Briefcase size={17} />
            <span>Open Case Workspaces</span>
            <ArrowRight size={16} />
          </button>
          <button className="btn-hero-light" onClick={() => navigate('/intake')}>
            <Sparkles size={17} />
            <span>Launch Two-Pass Intake</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
