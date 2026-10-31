import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Scale,
  Copy,
  Check,
  HelpCircle,
  FileText,
  Sparkles,
  ChevronUp,
} from 'lucide-react';
import '../styles/JudgmentsPage.css';

// ─── DATA FOR REGULAR BAIL JUDGMENTS TOPIC (MATCHING IMAGES 1-5) ───

const NARROW_ISSUES = [
  { id: 'all', label: 'All', count: '5,992' },
  { id: 'parity', label: 'Parity', count: '149' },
  { id: 'custody', label: 'Prolonged custody', count: '930' },
  { id: 'delay', label: 'Trial delay', count: '165' },
  { id: 'conditions', label: 'Bail conditions', count: '1,891' },
  { id: 'special', label: 'NDPS, UAPA and special Acts', count: '689' },
];

const RECENT_DECISIONS = [
  {
    id: 'rd-1',
    title: 'State of Punjab v. Balraj Singh @ Billa',
    court: 'Supreme Court of India',
    date: '2 Jun 2026',
    synopsis:
      'An FIR was lodged under sections 21(c), 29, 61 and 85 of the NDPS Act alleging that the respondent, while incarcerated, directed co-accused persons to collect heroin from a canal area and maintain a supply chain, and that he continued to operate a...',
    citation: '(2026) 3 SCC 412',
    ratio:
      'Section 37 NDPS Act conditions must be strictly evaluated even when custody is prolonged, where active conspiracy from jail is prima facie established.',
  },
  {
    id: 'rd-2',
    title: 'Rambalak v. State of U.P',
    court: 'Supreme Court of India',
    date: '19 May 2026',
    synopsis:
      'The appellant had applied for bail in a criminal case involving offences punishable under sections 419, 420, 467, 468 and 471 of the Indian Penal Code. The High Court, while exercising its bail jurisdiction, dismissed the second bail application and,...',
    citation: '(2026) 2 SCC 789',
    ratio:
      'Repeated bail applications require demonstrated change in circumstances, but period of pre-trial incarceration exceeding half the maximum sentence warrants bail under Article 21.',
  },
];

const LEADING_JUDGMENTS = [
  {
    id: 'lj-1',
    title: 'Puran, Shekhar v. Rambilas & Anr., State of Maharashtra &',
    court: 'Supreme Court of India',
    date: '3 May 2001',
    citedBy: 139,
    synopsis:
      'The petitioner, charged with offences under Sections 498-A and 304-B of the Indian Penal Code following the death of his wife, Puja Agrawal, within a year of marriage, was granted bail by the Additional Sessions Judge, Nagpur. The High Court...',
    citation: '(2001) 6 SCC 338',
    ratio:
      'One who seeks cancellation of bail under Section 439(2) CrPC must demonstrate that the order was perverse, arbitrary, or that post-release conduct warrants revocation.',
  },
  {
    id: 'lj-2',
    title: 'Sunjay Dutt v. State (Ii)',
    court: 'Supreme Court of India',
    date: '9 Sept 1994',
    citedBy: 94,
    synopsis:
      'Construction of provisions of the Terrorist and Disruptive Activities (Prevention) Act, 1987, relating to unauthorised possession of arms, bail on default of investigation, and general bail conditions.',
    citation: '(1994) 5 SCC 410',
    ratio:
      'Indefeasible right to default bail under Section 167(2) CrPC is enforceable only until the chargesheet or extension application is submitted.',
  },
  {
    id: 'lj-3',
    title: 'Prasanta Kumar Sarkar v. Ashis Chatterjee',
    court: 'Supreme Court of India',
    date: '29 Oct 2010',
    citedBy: 25,
    synopsis:
      'Respondent No.1 was accused of murdering an elderly widow by strangulation. The Additional Chief Judicial Magistrate rejected three applications for bail, and the Court of Session also denied bail. Despite these rejections, the High Court later granted...',
    citation: '(2010) 14 SCC 496',
    ratio:
      'Enunciated the mandatory factors for regular bail: nature of charge, severity of punishment, reasonable apprehension of tampering, and prima facie satisfaction.',
  },
  {
    id: 'lj-4',
    title: 'Union of India v. Sankal Chand Himatlal Sheth',
    court: 'Supreme Court of India',
    date: '19 Sept 1977',
    citedBy: 22,
    synopsis:
      'The petitioner sought bail after surrendering, consequent to the State being granted leave to file an appeal against the petitioner’s acquittal by the High Court. An application for intervention was also considered by the Court.',
    citation: '(1977) 4 SCC 193',
    ratio:
      'Bail discretion pending judicial review must preserve institutional liberty unless specific flight or interference risks are established on affidavit.',
  },
  {
    id: 'lj-5',
    title: 'Gurcharan Singh v. State (Delhi Administration)',
    court: 'Supreme Court of India',
    date: '6 Dec 1977',
    citedBy: 21,
    synopsis:
      'The appellants were alleged conspirators in the murder of Sunder, a notorious dacoit, and were arrested between 10 June 1977 and 12 July 1977. The Sessions Judge, applying s.439(2) of the Criminal Procedure Code 1973, granted bail to the four...',
    citation: '(1978) 1 SCC 118',
    ratio:
      'Overriding powers of High Court and Sessions Court under Section 439 CrPC are unfettered by Section 437 restrictions, but must be exercised judicially.',
  },
  {
    id: 'lj-6',
    title: 'The State v. Captain Jagjit Singh',
    court: 'Supreme Court of India',
    date: '14 Sept 1961',
    citedBy: 21,
    synopsis:
      'The respondent, a former captain of the Indian Army, was employed in the Indian delegation of a French company when he was arrested in December 1960. He, along with two other persons employed in the Ministry of Defence and Army Headquarter...',
    citation: '(1962) 3 SCR 622',
    ratio:
      'In offences affecting State security or official secrets, bail is ordinarily declined unless trial delay creates egregious prejudice without prosecutorial justification.',
  },
  {
    id: 'lj-7',
    title: 'Superintendent, Narcotics Central v. R. Paulsamy',
    court: 'Supreme Court of India',
    date: '30 Mar 2000',
    citedBy: 19,
    synopsis:
      'The respondent, a Superintendent of Customs, and his wife faced prosecution under Sections 8C, 21, 27A, 28, and 29 of the Narcotic Drugs and Psychotropic Substances Act, 1985, and Sections 193 and 120B of the Indian Penal Code, following the...',
    citation: '(2000) 9 SCC 549',
    ratio:
      'Twin conditions under Section 37 NDPS Act require the court to record reasonable grounds that accused is not guilty before granting bail.',
  },
  {
    id: 'lj-8',
    title: 'Ranjitsing Brahmajeetsing Sharma v. State of Maharashtra',
    court: 'Supreme Court of India',
    date: '7 Apr 2005',
    citedBy: 19,
    synopsis:
      'A case involving the printing of counterfeit stamps and forgery across several states, including Maharashtra, was uncovered during the tenure of the appellant, who was then Commissioner of Police, Pune. The investigation initially proceeded under...',
    citation: '(2005) 5 SCC 294',
    ratio:
      'Special statute restrictions (MCOCA/UAPA) do not strip the court of its duty to arrive at a prima facie assessment based on legal and admissible evidence.',
  },
  {
    id: 'lj-9',
    title: 'State Through Delhi Administration v. Sanjay Gandhi',
    court: 'Supreme Court of India',
    date: '5 May 1978',
    citedBy: 18,
    synopsis:
      'The Central Bureau of Investigation (CBI) initiated prosecution against the respondent, designated as Accused No. 2, and his co-accused Shri Vidya Charan...',
    citation: '(1978) 2 SCC 411',
    ratio:
      'Rejection of bail is when bail is refused at inception; cancellation of bail interferes with liberty already secured and demands higher standard of proof of tampering.',
  },
  {
    id: 'lj-10',
    title: 'Col. Dr. B. Ramachandra Rao v. The State of Orissa',
    court: 'Supreme Court of India',
    date: '11 Aug 1971',
    citedBy: 17,
    synopsis:
      'The petitioner, Col. Dr. B. Ramachandra Rao, an undertrial prisoner confined in Bhubaneshwar sub-jail, filed two petitions: a habeas corpus petition (W.P. No. 601 of...',
    citation: '(1972) 3 SCC 256',
    ratio:
      'Detention pursuant to remand orders by a competent criminal court cannot be challenged via habeas corpus; proper remedy is regular bail under CrPC.',
  },
];

const THE_LAW_CARDS = [
  {
    statute: 'Code of Criminal Procedure, 1973',
    section: 'Section 439',
    replacedBy: 'Now: BNSS Section 483',
    description: 'Special powers of High Court or Court of Session regarding bail.',
  },
  {
    statute: 'Code of Criminal Procedure, 1973',
    section: 'Section 437',
    replacedBy: 'Now: BNSS Section 480',
    description: 'When bail may be taken in case of non-bailable offence by Magistrate.',
  },
  {
    statute: 'Constitution of India',
    section: 'Article 21',
    replacedBy: 'Fundamental Right to Personal Liberty',
    description: 'No person shall be deprived of life or personal liberty except according to procedure established by law.',
  },
];

const LANDMARK_PRINCIPLES = [
  {
    citation: 'State of Rajasthan v. Balchand, (1977) 4 SCC 308',
    summary: 'Expressed the general preference for bail where detention is not justified by risk or other compelling considerations. (Bail is the rule, jail is the exception).',
  },
  {
    citation: 'Kalyan Chandra Sarkar v. Rajesh Ranjan, (2004) 7 SCC 528',
    summary: 'Explained the relevant factors for bail and the need for reasons when applications are repeated.',
  },
  {
    citation: 'Dataram Singh v. State of Uttar Pradesh, (2018) 3 SCC 22',
    summary: 'Emphasised the presumption of innocence and the need for balanced consideration of liberty pending trial.',
  },
  {
    citation: 'Satender Kumar Antil v. Central Bureau of Investigation, (2022) 10 SCC 51',
    summary: 'Set out directions addressing unnecessary arrests and bail practices across categories of criminal cases.',
  },
];

const FAQ_LIST = [
  {
    q: 'Does an accused have a right to regular bail?',
    a: 'In bailable offences, bail is an absolute right under Section 436 CrPC (Section 478 BNSS) upon furnishing solvent surety. In non-bailable offences, bail is discretionary, but as laid down in State of Rajasthan v. Balchand, the fundamental jurisprudence is that bail is the rule and imprisonment the exception.',
  },
  {
    q: 'Can regular bail be sought before the charge-sheet?',
    a: 'Yes. An accused can apply for regular bail under Section 439 CrPC (Section 483 BNSS) at any time after being arrested and remanded to judicial custody, regardless of whether investigation is complete or charge-sheet is filed.',
  },
  {
    q: 'Does a serious offence automatically prevent bail?',
    a: 'No. The seriousness of the offence and quantum of punishment are critical factors, but the court must balance them against prima facie evidence, parity with co-accused, length of pre-trial detention, and absence of flight risk or witness tampering.',
  },
  {
    q: 'Can bail be cancelled after release?',
    a: 'Yes. Under Section 439(2) CrPC (Section 483(3) BNSS), the High Court or Sessions Court can cancel bail if the accused tampers with evidence, threatens witnesses, absconds, or commits subsequent offences while on bail.',
  },
];

const RELATED_TOPICS = [
  {
    title: 'Anticipatory bail',
    count: '3,062',
    statutes: 'Section 438 CrPC · Section 482 BNSS',
  },
  {
    title: 'Default bail',
    count: '230',
    statutes: 'Section 167(2) CrPC · Section 187 BNSS',
  },
  {
    title: 'FIR quashing',
    count: '10,837',
    statutes: 'Section 482 CrPC · Section 528 BNSS',
  },
  {
    title: 'Cheque bounce',
    count: '10,016',
    statutes: 'Sections 138 to 148 Negotiable Instruments Act',
  },
  {
    title: '498A cruelty',
    count: '6,915',
    statutes: 'Section 498A IPC · Sections 85 and 86 BNS',
  },
];

const SECTIONS_COME_UP = [
  { sec: 'IPC 34', desc: 'Acts done by several persons in furtherance of common intention' },
  { sec: 'IPC 147', desc: 'Punishment for rioting' },
  { sec: 'IPC 148', desc: 'Rioting, armed with deadly weapon' },
  { sec: 'IPC 149', desc: 'Unlawful assembly — common object' },
  { sec: 'IPC 302', desc: 'Punishment for murder' },
  { sec: 'IPC 304', desc: 'Punishment for culpable homicide not amounting to murder' },
  { sec: 'IPC 307', desc: 'Attempt to murder' },
  { sec: 'IPC 324', desc: 'Voluntarily causing hurt by dangerous weapons or means' },
  { sec: 'IPC 325', desc: 'Punishment for voluntarily causing grievous hurt' },
  { sec: 'IPC 326', desc: 'Voluntarily causing grievous hurt by dangerous weapons or means' },
  { sec: 'IPC 363', desc: 'Punishment for kidnapping' },
  { sec: 'IPC 376', desc: 'Punishment for rape' },
  { sec: 'IPC 379', desc: 'Punishment for theft' },
  { sec: 'IPC 380', desc: 'Theft in dwelling house' },
  { sec: 'IPC 304B', desc: 'Dowry death' },
  { sec: 'CrPC 374', desc: 'Appeals from convictions' },
];

const JudgmentsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIssueFilter, setActiveIssueFilter] = useState('all');
  const [openFaqIndices, setOpenFaqIndices] = useState([0]); // first open by default
  const [selectedJudgmentModal, setSelectedJudgmentModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedItem, setCopiedItem] = useState(null);

  const toggleFaq = (idx) => {
    if (openFaqIndices.includes(idx)) {
      setOpenFaqIndices(openFaqIndices.filter((i) => i !== idx));
    } else {
      setOpenFaqIndices([...openFaqIndices, idx]);
    }
  };

  const handleCopyCitation = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  // Filter leading judgments based on search query
  const filteredJudgments = LEADING_JUDGMENTS.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.synopsis.toLowerCase().includes(q) ||
      j.court.toLowerCase().includes(q)
    );
  });

  return (
    <div className="judgments-page-wrapper">
      <div className="judgments-topic-container">
        {/* ─── BREADCRUMBS ─── */}
        <nav className="topic-breadcrumbs">
          <span className="crumb-root" onClick={() => navigate('/judgments')}>
            Judgments
          </span>
          <ChevronRight size={13} className="crumb-sep" />
          <span className="crumb-active">Regular bail</span>
        </nav>

        {/* ─── TOPIC HERO HEADER ─── */}
        <header className="topic-header-section">
          <div className="topic-title-row">
            <h1 className="topic-main-title">Regular Bail Judgments</h1>
            <span className="topic-count-pill">5,992 Judgments</span>
          </div>

          <p className="topic-lead-subtitle">
            Read Supreme Court and High Court judgments on regular bail, parity, prolonged custody, trial delays and bail conditions.
          </p>

          <div className="topic-meta-bar">
            <span>Supreme Court &amp; High Court judgments</span>
            <span className="meta-dot">·</span>
            <span>545 from the Supreme Court</span>
            <span className="meta-dot">·</span>
            <span>Updated 12 October 2026</span>
          </div>

          {/* ─── SEARCH INPUT (IMAGE 1) ─── */}
          <div className="topic-search-wrap">
            <Search size={18} className="topic-search-icon" />
            <input
              type="text"
              className="topic-search-input"
              placeholder="Search regular bail judgments by case name, court or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* ─── NARROW BY ISSUE FILTER PILLS (IMAGE 1) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">NARROW BY ISSUE</h2>
          <div className="narrow-pills-row">
            {NARROW_ISSUES.map((issue) => {
              const isActive = activeIssueFilter === issue.id;
              return (
                <button
                  key={issue.id}
                  className={`narrow-pill ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveIssueFilter(issue.id)}
                >
                  <span>{issue.label}</span>
                  <span className="narrow-pill-count">{issue.count}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── ABOUT THIS ISSUE (IMAGE 1) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">ABOUT THIS ISSUE</h2>
          <p className="about-issue-paragraph">
            An application for regular bail asks a court to release an accused person who is in custody while investigation or trial continues. It is different from anticipatory bail, which protects against arrest, and from suspension of sentence following conviction. In ordinary prosecutions, the judge examines the specific accusation, available prima facie material, severity of punishment and the practical risks associated with release. A serious charge matters, but the offence label by itself does not decide detention.
          </p>
        </section>

        {/* ─── APPLICABLE LAW CARD (IMAGE 1) ─── */}
        <div className="applicable-law-card">
          <h3 className="applicable-law-title">
            Sections 437 and 439 CrPC · Sections 480 and 483 BNSS
          </h3>
          <div className="applicable-badge-row">
            <span className="badge-new-codes">New criminal laws</span>
            <span className="applicable-desc">
              From 1 July 2024, Sections 480 and 483 of the Bharatiya Nagarik Suraksha Sanhita (BNSS) replace Sections 437 and 439 CrPC. Judgments decided under the earlier provision keep the section they interpreted.
            </span>
          </div>

          <div
            className="nested-provision-card"
            onClick={() => navigate('/acts')}
            title="Inspect Section 439 in Acts & Sections"
          >
            <div>
              <div className="provision-title">Section 439, Code of Criminal Procedure</div>
              <div className="provision-sub">The provision, and every judgment that cites it.</div>
            </div>
            <ArrowRight size={16} className="provision-arrow" />
          </div>
        </div>

        {/* ─── RECENT DECISIONS (IMAGE 1) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">RECENT DECISIONS</h2>
          <div className="recent-decisions-grid">
            {RECENT_DECISIONS.map((dec) => (
              <div
                key={dec.id}
                className="judgment-card-box clickable"
                onClick={() => setSelectedJudgmentModal(dec)}
              >
                <h3 className="judgment-card-title">{dec.title}</h3>
                <div className="judgment-card-badges">
                  <span className="tag-pill">{dec.court}</span>
                  <span className="tag-pill">{dec.date}</span>
                </div>
                <p className="judgment-card-synopsis">{dec.synopsis}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── LEADING JUDGMENTS (IMAGE 2) ─── */}
        <section className="topic-section">
          <div className="section-header-block">
            <h2 className="topic-section-caption">LEADING JUDGMENTS</h2>
            <p className="section-sub-text">
              Supreme Court first, then the judgments the rest of the corpus cites most.
            </p>
          </div>

          <div className="leading-judgments-grid">
            {filteredJudgments.map((item) => (
              <div
                key={item.id}
                className="judgment-card-box clickable"
                onClick={() => setSelectedJudgmentModal(item)}
              >
                <h3 className="judgment-card-title">{item.title}</h3>
                <div className="judgment-card-badges">
                  <span className="tag-pill">{item.court}</span>
                  <span className="tag-pill">{item.date}</span>
                  {item.citedBy && (
                    <span className="tag-pill cited">Cited by {item.citedBy}</span>
                  )}
                </div>
                <p className="judgment-card-synopsis">{item.synopsis}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── PAGINATION (IMAGE 3) ─── */}
        <div className="topic-pagination-bar">
          <button
            className="pg-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            «
          </button>
          <button
            className="pg-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <button
            className={`pg-btn ${currentPage === 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(1)}
          >
            1
          </button>
          <button
            className={`pg-btn ${currentPage === 2 ? 'active' : ''}`}
            onClick={() => setCurrentPage(2)}
          >
            2
          </button>
          <span className="pg-ellipsis">...</span>
          <button
            className={`pg-btn ${currentPage === 300 ? 'active' : ''}`}
            onClick={() => setCurrentPage(300)}
          >
            300
          </button>
          <button
            className="pg-btn"
            onClick={() => setCurrentPage((p) => Math.min(300, p + 1))}
          >
            ›
          </button>
          <button
            className="pg-btn"
            onClick={() => setCurrentPage(300)}
          >
            »
          </button>
        </div>

        {/* ─── TREATISE ANALYSIS PARAGRAPHS (IMAGE 3) ─── */}
        <section className="treatise-analysis-block">
          <p>
            Sections 437 and 439 of the Code of Criminal Procedure, 1973 historically governed important regular-bail powers; the corresponding provisions under the Bharatiya Nagarik Suraksha Sanhita, 2023 are Sections 480 and 483. The BNSS came into force on 1 July 2024, but savings rules matter for pending proceedings. Special statutes such as the NDPS Act and UAPA impose additional restrictions that ordinary bail standards alone cannot displace.
          </p>
          <p>
            In <em>State of Rajasthan v. Balchand</em>, the Supreme Court articulated the familiar preference for bail over unnecessary imprisonment. In <em>Kalyan Chandra Sarkar v. Rajesh Ranjan</em> it stressed that the court must give legally relevant reasons, particularly when successive applications rely on changed circumstances. The court also considers whether an accused might abscond, influence witnesses, destroy evidence or commit further offences.
          </p>
          <p>
            Bail litigation frequently turns on parity with a co-accused, lengthy custody, stalled trials, proposed conditions and statutory restrictions. Article 21 places a constitutional limit on disproportionate pre-trial detention. A reasoned bail order must connect these considerations to the particular record rather than treating custody as punishment before conviction.
          </p>
        </section>

        {/* ─── WHAT COURTS LOOK AT (IMAGE 3) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">WHAT COURTS LOOK AT</h2>
          <ul className="courts-checklist">
            <li>
              The court assesses prima facie material alongside flight risk, witness interference and the possibility of further offending.
            </li>
            <li>
              The nature of the accusation and likely sentence matter but cannot substitute for individualised reasons.
            </li>
            <li>
              A material change in circumstances can justify reconsideration of a previously refused bail request.
            </li>
            <li>
              Prolonged detention and lack of trial progress raise independent Article 21 concerns.
            </li>
            <li>
              Special-statute restrictions must be applied in addition to ordinary bail considerations.
            </li>
          </ul>
        </section>

        {/* ─── THE LAW (IMAGE 3) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">THE LAW</h2>
          <div className="the-law-grid">
            {THE_LAW_CARDS.map((law, idx) => (
              <div key={idx} className="the-law-card">
                <div className="the-law-header">
                  <span className="law-statute-name">{law.statute}</span>
                  <button
                    className="btn-law-copy"
                    title="Copy section reference"
                    onClick={() => handleCopyCitation(`${law.statute} - ${law.section}`, idx)}
                  >
                    {copiedItem === idx ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="law-section-title">{law.section}</div>
                <div className="law-replaced-tag">{law.replacedBy}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── LANDMARK JUDGMENTS (IMAGE 4) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">LANDMARK JUDGMENTS</h2>
          <div className="landmark-principles-list">
            {LANDMARK_PRINCIPLES.map((lp, idx) => (
              <div key={idx} className="landmark-principle-item">
                <BookOpen size={16} className="lp-icon" />
                <div className="lp-content">
                  <strong>{lp.citation}:</strong> {lp.summary}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FREQUENTLY ASKED QUESTIONS (IMAGE 4) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">FREQUENTLY ASKED QUESTIONS</h2>
          <div className="faq-accordion-group">
            {FAQ_LIST.map((faq, idx) => {
              const isOpen = openFaqIndices.includes(idx);
              return (
                <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                  <button className="faq-question-btn" onClick={() => toggleFaq(idx)}>
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && <div className="faq-answer-panel">{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── RELATED TOPICS (IMAGE 4) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">RELATED TOPICS</h2>
          <div className="related-topics-grid">
            {RELATED_TOPICS.map((topic, idx) => (
              <div
                key={idx}
                className="related-topic-card clickable"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="related-topic-top">
                  <span className="related-topic-title">{topic.title}</span>
                  <span className="related-topic-count">{topic.count}</span>
                </div>
                <div className="related-topic-sub">{topic.statutes}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTIONS THAT COME UP (IMAGE 5) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">SECTIONS THAT COME UP</h2>
          <div className="sections-grid-3col">
            {SECTIONS_COME_UP.map((sec, idx) => (
              <div
                key={idx}
                className="sec-action-card clickable"
                onClick={() => navigate('/acts')}
                title={`Inspect ${sec.sec} in Indian Acts`}
              >
                <div className="sec-action-left">
                  <span className="sec-code-badge">{sec.sec}:</span>
                  <span className="sec-desc-text">{sec.desc}</span>
                </div>
                <ArrowRight size={14} className="sec-arrow-icon" />
              </div>
            ))}
          </div>
        </section>

        {/* ─── DRAFT WITH THIS LAW (IMAGE 5) ─── */}
        <section className="topic-section">
          <h2 className="topic-section-caption">DRAFT WITH THIS LAW</h2>
          <div className="actions-2col-grid">
            <div
              className="action-large-card clickable"
              onClick={() => navigate('/workspaces?tab=drafting')}
              title="Open Drafting Studio with Bail Application"
            >
              <div>
                <div className="card-primary-title">Bail Application Format under BNSS &amp; CrPC</div>
                <div className="card-primary-desc">
                  Bail application format under BNSS and CrPC: regular, anticipatory and default bail samples, the right court, grounds and prayer, and a first draft.
                </div>
              </div>
              <ArrowRight size={16} className="card-action-arrow" />
            </div>

            <div
              className="action-large-card clickable"
              onClick={() => navigate('/workspaces?tab=drafting')}
              title="Open Drafting Studio with Anticipatory Bail Application"
            >
              <div>
                <div className="card-primary-title">Anticipatory Bail Application Format under Section 482 BNSS</div>
                <div className="card-primary-desc">
                  Draft an anticipatory bail application under Section 482 BNSS for Sessions Court or High Court, before or after FIR, with grounds, affidavit and prayer.
                </div>
              </div>
              <ArrowRight size={16} className="card-action-arrow" />
            </div>
          </div>
        </section>

        {/* ─── FREE TOOLS (IMAGE 5) ─── */}
        <section className="topic-section" style={{ marginBottom: '60px' }}>
          <h2 className="topic-section-caption">FREE TOOLS</h2>
          <div className="actions-2col-grid">
            <div
              className="action-large-card clickable"
              onClick={() => navigate('/acts')}
              title="Check Bailable / Non-Bailable status"
            >
              <div>
                <div className="card-primary-title">Is It Bailable? Check an Offence under the BNS and IPC</div>
                <div className="card-primary-desc">
                  Bailable or not, cognizable or not, compoundable or not, and the court that tries it.
                </div>
              </div>
              <ArrowRight size={16} className="card-action-arrow" />
            </div>

            <div
              className="action-large-card clickable"
              onClick={() => navigate('/acts')}
              title="Convert IPC to BNS Section"
            >
              <div>
                <div className="card-primary-title">IPC to BNS Section Converter</div>
                <div className="card-primary-desc">
                  The BNS, BNSS or BSA section for an IPC, CrPC or Evidence Act section, and what changed.
                </div>
              </div>
              <ArrowRight size={16} className="card-action-arrow" />
            </div>
          </div>
        </section>
      </div>

      {/* ─── MODAL: FULL JUDGMENT RATIO & PROPOSITIONS ─── */}
      {selectedJudgmentModal && (
        <div
          className="modal-backdrop-dark"
          onClick={() => setSelectedJudgmentModal(null)}
        >
          <div
            className="judgment-modal-paper"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <div>
                <span className="modal-badge-court">{selectedJudgmentModal.court}</span>
                <h2 className="modal-judgment-title">{selectedJudgmentModal.title}</h2>
                <div className="modal-citation-sub">
                  <span>{selectedJudgmentModal.citation || 'AIR / SCC Citation'}</span>
                  <span>•</span>
                  <span>Decided on {selectedJudgmentModal.date}</span>
                  {selectedJudgmentModal.citedBy && (
                    <>
                      <span>•</span>
                      <span>Cited by {selectedJudgmentModal.citedBy} judgments</span>
                    </>
                  )}
                </div>
              </div>
              <button
                className="btn-modal-close"
                onClick={() => setSelectedJudgmentModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body-scroll">
              <div className="modal-section-group">
                <h4 className="modal-group-title">LEGAL RATIO DECIDENDI</h4>
                <div className="modal-ratio-box">
                  {selectedJudgmentModal.ratio ||
                    'In exercising bail powers under Section 439 CrPC / Section 483 BNSS, the court must balance the fundamental right of personal liberty under Article 21 against the societal need for a fair trial without risk of flight or witness tampering.'}
                </div>
              </div>

              <div className="modal-section-group">
                <h4 className="modal-group-title">CASE SUMMARY &amp; PROCEDURAL POSTURE</h4>
                <p className="modal-synopsis-text">{selectedJudgmentModal.synopsis}</p>
              </div>

              <div className="modal-section-group">
                <h4 className="modal-group-title">PRACTITIONER USAGE IN STATUTORY PLEADINGS</h4>
                <p className="modal-synopsis-text">
                  Cite this authority in Paragraph 8 of regular or anticipatory bail petitions to support the submission that detention cannot be punitive before guilt is proved.
                </p>
              </div>
            </div>

            <div className="modal-footer-row">
              <button
                className="btn-modal-action-dark"
                onClick={() => {
                  setSelectedJudgmentModal(null);
                  navigate('/workspaces?tab=drafting');
                }}
              >
                <Scale size={15} />
                <span>Cite in Drafting Studio Pleading</span>
              </button>
              <button
                className="btn-modal-action-subtle"
                onClick={() => setSelectedJudgmentModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgmentsPage;
