import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Scale,
  ArrowRight,
  ExternalLink,
  Sparkles,
  FileText,
} from 'lucide-react';
import '../styles/ActsPage.css';

const JUMP_ACTS = [
  'IPC',
  'CrPC',
  'CPC',
  'Motor Vehicles Act',
  'NI Act',
  'Hindu Marriage Act',
  'Constitution of India',
  'Income Tax Act',
  'Limitation Act',
  'Companies Act',
  'Transfer of Property Act',
  'Indian Evidence Act',
  'Specific Relief Act',
  'CPA',
];

const NEW_CRIMINAL_CODES = [
  {
    code: 'BNS',
    title: 'Bharatiya Nyaya Sanhita, 2023 (BNS)',
    description:
      '358 sections in 20 chapters, each with the IPC section it replaced and the judgments decided under it.',
    link: '#bns',
  },
  {
    code: 'BNSS',
    title: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
    description:
      '531 sections in 39 chapters, each with the CrPC section it replaced and the judgments decided under it.',
    link: '#bnss',
  },
  {
    code: 'BSA',
    title: 'Bharatiya Sakshya Adhiniyam, 2023 (BSA)',
    description:
      '170 sections in 12 chapters, each with the Evidence Act section it replaced and the judgments decided under it.',
    link: '#bsa',
  },
];

const IPC_SECTIONS = [
  {
    sec: 'Section 302',
    bnsEq: 'BNS 103',
    title: 'Punishment for murder',
    desc: 'Death or imprisonment for life, and shall also be liable to fine.',
  },
  {
    sec: 'Section 34',
    bnsEq: 'BNS 3(5)',
    title: 'Acts done by several persons in furtherance of common intention',
    desc: 'Each of such persons is liable for that act in the same manner as if it were done by him alone.',
  },
  {
    sec: 'Section 323',
    bnsEq: 'BNS 115',
    title: 'Punishment for voluntarily causing hurt',
    desc: 'Imprisonment of either description for a term which may extend to one year, or with fine.',
  },
  {
    sec: 'Section 307',
    bnsEq: 'BNS 109',
    title: 'Attempt to murder',
    desc: 'Imprisonment of either description for a term which may extend to ten years, and fine.',
  },
  {
    sec: 'Section 324',
    bnsEq: 'BNS 118',
    title: 'Voluntarily causing hurt by dangerous weapons or means',
    desc: 'Instruments for shooting, stabbing or cutting, or any instrument which used as a weapon of offence is likely to cause death.',
  },
  {
    sec: 'Section 147',
    bnsEq: 'BNS 191(2)',
    title: 'Punishment for rioting',
    desc: 'Imprisonment of either description for a term which may extend to two years, or with fine.',
  },
  {
    sec: 'Section 149',
    bnsEq: 'BNS 190',
    title: 'Unlawful assembly — common object',
    desc: 'Every person who, at the time of committing that offence, is a member of the same assembly, is guilty of that offence.',
  },
  {
    sec: 'Section 148',
    bnsEq: 'BNS 191(3)',
    title: 'Rioting, armed with deadly weapon',
    desc: 'Guilty of rioting, being armed with a deadly weapon or with anything which used as a weapon of offence is likely to cause death.',
  },
  {
    sec: 'Section 420',
    bnsEq: 'BNS 318(4)',
    title: 'Cheating and dishonestly inducing delivery of property',
    desc: 'Imprisonment for a term which may extend to seven years, and shall also be liable to fine.',
  },
  {
    sec: 'Section 406',
    bnsEq: 'BNS 316',
    title: 'Punishment for criminal breach of trust',
    desc: 'Imprisonment of either description for a term which may extend to three years, or with fine.',
  },
  {
    sec: 'Section 506',
    bnsEq: 'BNS 351',
    title: 'Punishment for criminal intimidation',
    desc: 'Imprisonment of either description for a term which may extend to two years, or with fine.',
  },
  {
    sec: 'Section 376',
    bnsEq: 'BNS 64',
    title: 'Punishment for rape',
    desc: 'Rigorous imprisonment for a term which shall not be less than ten years, but which may extend to imprisonment for life.',
  },
];

export const ActsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [showAllSections, setShowAllSections] = useState(false);

  const displayedSections = showAllSections ? IPC_SECTIONS : IPC_SECTIONS.slice(0, 8);

  const filteredSections = displayedSections.filter(
    (s) =>
      !searchQuery ||
      s.sec.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.bnsEq && s.bnsEq.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="acts-page-container">
      {/* ─── HERO SEARCH HEADER ─── */}
      <div className="acts-hero">
        <h1 className="acts-hero-title">Indian Acts &amp; Sections</h1>

        {/* Search Bar */}
        <div className="acts-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="acts-search-input"
            placeholder="Search acts, sections or judgments... e.g. 302, divorce, BNS 103"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Jump to an Act Pills */}
        <div className="jump-acts-block">
          <span className="jump-acts-label">JUMP TO AN ACT</span>
          <div className="jump-acts-row">
            {JUMP_ACTS.map((act, i) => (
              <span
                key={i}
                className="jump-pill"
                onClick={() => setSearchQuery(act)}
              >
                {act}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── NEW CRIMINAL CODES (FROM 1 JULY 2024) (IMAGE 5) ─── */}
      <section className="new-criminal-codes-section">
        <span className="new-codes-eyebrow">NEW CRIMINAL CODES (FROM 1 JULY 2024)</span>
        <div className="new-codes-grid">
          {NEW_CRIMINAL_CODES.map((code) => (
            <div
              key={code.code}
              className="new-code-card"
              onClick={() => {
                navigate('/workspaces?tab=drafting');
              }}
            >
              <div className="new-code-card-header">
                <span className="new-code-title">{code.title}</span>
                <ArrowRight size={14} className="text-gray-400" />
              </div>
              <p className="new-code-desc">{code.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── INDIAN PENAL CODE, 1860 (IMAGE 5) ─── */}
      <section className="ipc-sections-block">
        <div className="ipc-header-row">
          <div className="flex items-center gap-3">
            <h2 className="ipc-main-title">Indian Penal Code, 1860</h2>
            <span className="ipc-tag">IPC</span>
            <span className="ipc-judgments-count">1,05,066 Judgments</span>
          </div>
          <button className="btn-all-judgments" onClick={() => navigate('/judgments')}>
            <span>All judgments</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <p className="ipc-explanation">
          The Indian Penal Code was the principal criminal code of India until the Bharatiya Nyaya
          Sanhita (BNS) replaced it on 1 July 2024. Judgments delivered before that date cite IPC
          section numbers, so IPC remains the way to research the precedent behind any BNS provision.
        </p>

        {/* Section Cards Grid */}
        <div className="ipc-cards-grid">
          {filteredSections.map((item, idx) => (
            <div
              key={idx}
              className="section-card"
              onClick={() => setSelectedSection(item)}
            >
              <div className="section-card-top">
                <span className="section-number">{item.sec}</span>
                {item.bnsEq && <span className="bns-tag">{item.bnsEq}</span>}
              </div>
              <div className="section-title">{item.title}</div>
            </div>
          ))}
        </div>

        <div className="show-more-row">
          <button
            className="btn-show-all-sections"
            onClick={() => setShowAllSections(!showAllSections)}
          >
            <span>{showAllSections ? 'Show fewer sections' : 'Show all 28 sections'}</span>
            <ChevronDown size={14} className={showAllSections ? 'rotate-180' : ''} />
          </button>
        </div>
      </section>

      {/* ─── MODAL: SECTION DETAIL & CORRESPONDING BNS PROVISION ─── */}
      {selectedSection && (
        <div className="modal-overlay" onClick={() => setSelectedSection(null)}>
          <div className="modal-content-section" onClick={(e) => e.stopPropagation()}>
            <div className="section-modal-header">
              <div>
                <div className="flex items-center gap-2">
                  <span className="section-modal-num">{selectedSection.sec}</span>
                  {selectedSection.bnsEq && (
                    <span className="bns-tag-modal">Replaced by {selectedSection.bnsEq}</span>
                  )}
                </div>
                <h3 className="section-modal-title">{selectedSection.title}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedSection(null)}>
                ✕
              </button>
            </div>

            <div className="section-modal-body">
              <div className="statutory-text-box">
                <span className="statutory-label">Statutory Text &amp; Punishment</span>
                <p className="statutory-content">{selectedSection.desc}</p>
              </div>

              <div className="section-modal-actions">
                <button
                  className="btn-use-section"
                  onClick={() => {
                    setSelectedSection(null);
                    navigate('/workspaces?tab=drafting');
                  }}
                >
                  <Sparkles size={14} />
                  <span>Draft Pleading under {selectedSection.bnsEq || selectedSection.sec}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActsPage;
