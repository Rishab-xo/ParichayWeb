import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft, RefreshCw, FileText } from 'lucide-react';
import BriefEditor from '../components/BriefEditor';
import { generateDraftBrief } from '../utils/api';
import '../styles/DocumentFlow.css';

const questions = [
    { id: 1, key: 'recipient', label: "Who is this document addressed to?", placeholder: "e.g. My landlord, Employer, Police station" },
    { id: 2, key: 'facts', label: "What is the key issue and narrative?", placeholder: "Describe what happened, dates, amounts, or violations..." },
    { id: 3, key: 'demands', label: "What is the specific relief or demand requested?", placeholder: "e.g. Full settlement payment within 7 days, immediate lease termination" }
];

const DocumentFlow = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const docType = location.state?.docType || "Legal Notice";
    const initialFacts = location.state?.facts || "";
    const domain = location.state?.domain || docType;
    const autoGenerate = location.state?.autoGenerate || false;

    const [step, setStep] = useState(autoGenerate && initialFacts ? 4 : 1);
    const [answers, setAnswers] = useState({
        recipient: '',
        facts: initialFacts,
        demands: ''
    });
    const [loading, setLoading] = useState(false);
    const [generatedMarkdown, setGeneratedMarkdown] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const triggerGeneration = async (factsPayload) => {
        setLoading(true);
        setErrorMsg('');
        try {
            const draft = await generateDraftBrief(factsPayload, domain);
            setGeneratedMarkdown(draft || generateFallbackMarkdown(factsPayload));
            setStep(4);
        } catch (err) {
            console.warn("Backend brief generation failed (" + err.message + "), using standard template.");
            setGeneratedMarkdown(generateFallbackMarkdown(factsPayload));
            setStep(4);
        } finally {
            setLoading(false);
        }
    };

    const generateFallbackMarkdown = (facts) => {
        return `# LEGAL BRIEF & NOTICE: ${docType.toUpperCase()}

**Date:** [INSERT DATE]  
**Jurisdiction:** India  
**Matter Category:** ${domain}  

---

### 1. PARTIES INVOLVED
- **Complainant / Claimant:** [INSERT CLIENT NAME], residing at [INSERT ADDRESS]
- **Respondent:** ${answers.recipient || '[INSERT RESPONDENT / EMPLOYER / LANDLORD NAME]'}

---

### 2. STATEMENT OF FACTS
${facts || 'The client reported a dispute involving ' + domain + '.\n\n- [INSERT CHRONOLOGICAL DETAILS HERE]\n- [INSERT KEY EVIDENCE / CONTRACT DATE]'}

---

### 3. LEGAL GROUNDS & VIOLATIONS
- Violation of standard contractual obligations and applicable statutory protections.
- Failure to fulfill agreed covenants and terms of engagement.

---

### 4. RELIEF & DEMANDS
${answers.demands ? `- ${answers.demands}` : '- Immediate restitution, remediation, or release of disputed funds within 15 days.\n- Cease and desist from unlawful actions.'}

---

**Advocate for Complainant:**  
[SIGNATURE]  
Advocate / Legal Representative
`;
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
                    <div className="preview-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <CheckCircle className="success-icon" size={42} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{docType} Generated</h2>
                        <p style={{ color: '#6b7280' }}>
                            You can live edit dates and details below, then export directly to DOCX or PDF.
                        </p>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
                            <p>Generating legal draft with Spring AI RAG...</p>
                        </div>
                    ) : (
                        <div>
                            {generatedMarkdown && (
                                <BriefEditor initialMarkdown={generatedMarkdown} />
                            )}
                        </div>
                    )}

                    <div className="preview-actions" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        <button className="btn-secondary" onClick={() => setStep(1)}>
                            ← Edit Inputs & Regenerate
                        </button>
                    </div>
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
