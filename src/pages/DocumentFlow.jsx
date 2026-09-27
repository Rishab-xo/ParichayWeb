import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { CheckCircle, ArrowRight, ArrowLeft, RefreshCw, AlertTriangle, Scale, ChevronDown, ChevronUp, BookOpen, MessageSquare } from 'lucide-react';
import BriefEditor from '../components/BriefEditor';
import { generateDraftBrief } from '../utils/api';
import '../styles/DocumentFlow.css';

const questions = [
    { id: 1, key: 'recipient', label: "Who is this document addressed to?", placeholder: "e.g. Landlord, Employer, Police Station, Opposite Party" },
    { id: 2, key: 'facts', label: "What is the key issue and narrative?", placeholder: "Describe what happened, dates, amounts, or violations..." },
    { id: 3, key: 'demands', label: "What is the specific relief or demand requested?", placeholder: "e.g. Immediate restoration of possession, refund of security deposit with 18% interest..." }
];

const DocumentFlow = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const docType = location.state?.docType || "Legal Petition Brief";
    const initialFacts = location.state?.facts || "";
    const gatheredFacts = location.state?.gatheredFacts || null;
    const domain = location.state?.domain || "CIVIL_PROPERTY";
    const categoryLabel = location.state?.categoryLabel || docType;
    const sessionId = location.state?.sessionId || null;
    const autoGenerate = location.state?.autoGenerate || false;

    const [step, setStep] = useState(autoGenerate && initialFacts ? 4 : 1);
    const [answers, setAnswers] = useState({
        recipient: '',
        facts: initialFacts,
        demands: ''
    });
    const [loading, setLoading] = useState(false);
    const [generatedMarkdown, setGeneratedMarkdown] = useState('');
    const [retrievedStatutes, setRetrievedStatutes] = useState('');
    const [hasStatutes, setHasStatutes] = useState(true);
    const [showStatutes, setShowStatutes] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const triggerGeneration = async (factsPayload) => {
        setLoading(true);
        setErrorMsg('');
        try {
            // Freshly request the active token right before API call
            let token = null;
            try {
                token = await getToken();
            } catch (authErr) {
                console.warn("Could not retrieve fresh Clerk token:", authErr);
            }

            const res = await generateDraftBrief(factsPayload, domain, {
                categoryLabel,
                gatheredFacts,
                sessionId
            }, token);

            const markdown = typeof res === 'string' ? res : (res?.draft || '');
            const statutes = typeof res === 'object' ? (res?.retrievedStatutes || '') : '';
            const lawsFound = typeof res === 'object' ? Boolean(res?.hasStatutes) : true;

            if (!markdown || markdown.trim().length === 0) {
                throw new Error("No draft content returned from the drafting engine.");
            }

            setGeneratedMarkdown(markdown);
            setRetrievedStatutes(statutes);
            setHasStatutes(lawsFound);
            setStep(4);
        } catch (err) {
            console.error("Backend brief generation failed:", err);
            setErrorMsg(err.message || "Failed to generate legal draft with RAG.");
            setStep(4);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoGenerate && initialFacts) {
            triggerGeneration(initialFacts);
        }
    }, [autoGenerate, initialFacts]);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            const compiledFacts = `Recipient: ${answers.recipient}\nFacts: ${answers.facts}\nDemands: ${answers.demands}`;
            triggerGeneration(compiledFacts);
        }
    };

    const handleBack = () => {
        if (step > 1 && step < 4) setStep(step - 1);
        else if (step === 4) setStep(1);
        else navigate('/documents');
    };

    if (step === 4) {
        return (
            <div className="doc-flow-page container" style={{ paddingBottom: '60px' }}>
                <div className="doc-preview-container fade-in">
                    {/* Header */}
                    <div className="preview-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
                        {errorMsg ? (
                            <>
                                <AlertTriangle size={42} style={{ color: '#ef4444', margin: '0 auto 12px' }} />
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
                                    Brief Generation Failed
                                </h2>
                                <p style={{ color: '#6b7280', maxWidth: '600px', margin: '8px auto 0' }}>
                                    {errorMsg}
                                </p>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="success-icon" size={42} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
                                    {docType} Generated
                                </h2>
                                <p style={{ color: '#6b7280' }}>
                                    Formal Indian court-ready draft with citations from statutory RAG. Edit and export below.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                            <RefreshCw className="animate-spin" size={36} style={{ margin: '0 auto 16px', color: '#3b82f6' }} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151' }}>
                                Drafting Legal Petition with Statutory RAG...
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '6px' }}>
                                Retrieving embedded Acts & Sections for {categoryLabel} and synthesizing legal grounds...
                            </p>
                        </div>
                    )}

                    {/* Error State with actionable buttons */}
                    {!loading && errorMsg && (
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                            maxWidth: '700px',
                            margin: '0 auto 24px'
                        }}>
                            <p style={{ color: '#991b1b', fontSize: '0.95rem', marginBottom: '16px', lineHeight: 1.5 }}>
                                The statutory engine could not complete the draft. This usually occurs if the vector database does not have embedded laws for this specific category or if the backend service timed out.
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => triggerGeneration(answers.facts || initialFacts)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <RefreshCw size={16} />
                                    <span>Retry Generation</span>
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={() => navigate('/chat')}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <MessageSquare size={16} />
                                    <span>Return to Case Intake</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success State with Statutory Context & TipTap Editor */}
                    {!loading && generatedMarkdown && (
                        <div>
                            {/* Statutory RAG Provenance Card */}
                            {retrievedStatutes && hasStatutes && (
                                <div style={{
                                    maxWidth: '900px',
                                    margin: '0 auto 20px',
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '10px',
                                    padding: '12px 18px',
                                    fontSize: '0.88rem'
                                }}>
                                    <div 
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                        onClick={() => setShowStatutes(!showStatutes)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 600 }}>
                                            <Scale size={18} />
                                            <span>RAG Grounding: Verified Against Embedded Indian Statutes</span>
                                        </div>
                                        <button 
                                            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: 600 }}
                                        >
                                            <BookOpen size={14} />
                                            <span>{showStatutes ? 'Hide Retrieved Laws' : 'View Retrieved Laws'}</span>
                                            {showStatutes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                        </button>
                                    </div>
                                    {showStatutes && (
                                        <div style={{
                                            marginTop: '12px',
                                            paddingTop: '12px',
                                            borderTop: '1px solid #dcfce7',
                                            maxHeight: '260px',
                                            overflowY: 'auto',
                                            color: '#1e293b',
                                            fontFamily: 'monospace',
                                            fontSize: '0.8rem',
                                            whiteSpace: 'pre-wrap',
                                            background: '#ffffff',
                                            padding: '12px',
                                            borderRadius: '6px'
                                        }}>
                                            {retrievedStatutes}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Advisory banner if statutes were not found */}
                            {!hasStatutes && (
                                <div style={{
                                    maxWidth: '900px',
                                    margin: '0 auto 20px',
                                    background: '#fffbeb',
                                    border: '1px solid #fde68a',
                                    borderRadius: '10px',
                                    padding: '12px 18px',
                                    color: '#92400e',
                                    fontSize: '0.88rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                                    <span>
                                        <strong>Statutory Notice:</strong> Specific embedded statutes were not indexed for {categoryLabel}. The draft was structured with placeholders: <code>[INSERT ACT / SECTION]</code>. Please verify applicable state or central acts before filing.
                                    </span>
                                </div>
                            )}

                            {/* Live WYSIWYG Editor */}
                            <BriefEditor initialMarkdown={generatedMarkdown} />

                            <div className="preview-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                                <button className="btn-secondary" onClick={() => setStep(1)}>
                                    ← Edit Narrative Inputs
                                </button>
                                <button className="btn-secondary" onClick={() => triggerGeneration(answers.facts || initialFacts)}>
                                    <RefreshCw size={14} style={{ marginRight: '6px' }} />
                                    Regenerate Draft
                                </button>
                                <button className="btn-secondary" onClick={() => navigate('/chat')}>
                                    <MessageSquare size={14} style={{ marginRight: '6px' }} />
                                    Return to Intake Chat
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const currentQ = questions[step - 1];

    return (
        <div className="doc-flow-page container">
            <div className="flow-header">
                <button onClick={handleBack} className="back-btn"><ArrowLeft size={20} /></button>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${(step / 3) * 100}%` }}></div>
                </div>
                <span className="step-count">Step {step} of 3</span>
            </div>

            <div className="question-container fade-in">
                <h2>{currentQ.label}</h2>

                {loading ? (
                    <div className="typing-loader">
                        <span></span><span></span><span></span>
                    </div>
                ) : (
                    <div className="input-group">
                        <textarea
                            className="flow-input"
                            rows={3}
                            placeholder={currentQ.placeholder}
                            value={answers[currentQ.key]}
                            onChange={(e) => setAnswers({ ...answers, [currentQ.key]: e.target.value })}
                            autoFocus
                        />
                        <button 
                            className="flow-next-btn" 
                            onClick={handleNext}
                            disabled={loading}
                        >
                            {step === 3 ? 'Generate Draft ✨' : 'Next'} <ArrowRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentFlow;
