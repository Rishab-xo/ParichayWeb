import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ActionCard from '../components/ActionCard';
import '../styles/TriageResult.css';

const TriageResult = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const issue = location.state?.issue || "General Legal Issue";
    const issueCategory = location.state?.issueCategory || "Legal Dispute";
    const extractedFacts = location.state?.extractedFacts || null;

    const handlePrepareDocuments = () => {
        const factsPayload = extractedFacts && Object.keys(extractedFacts).length > 0
            ? JSON.stringify(extractedFacts, null, 2)
            : issue;

        navigate('/document-flow', {
            state: {
                docType: `${issueCategory} Notice`,
                facts: factsPayload,
                domain: issueCategory,
                autoGenerate: true
            }
        });
    };

    return (
        <div className="triage-result-page container">
            <div className="result-header fade-in">
                <div className="result-badge">TRIAGE COMPLETE</div>
                <h1>Here's what you can do.</h1>
                <p className="issue-summary">
                    <strong>Identified Category:</strong> {issueCategory}
                </p>
            </div>

            <div className="result-grid fade-in" style={{ animationDelay: '0.2s' }}>
                <ActionCard
                    title="Generate Draft Brief"
                    description="AI will formulate legal grounds, timeline, and notice draft."
                    onClick={handlePrepareDocuments}
                />
                <ActionCard
                    title="Prepare documents"
                    description="Choose from customizable legal templates and notice types."
                    onClick={() => navigate('/documents')}
                />
                <ActionCard
                    title="Talk to a lawyer"
                    description="Connect with a verified legal advocate for case review."
                    onClick={() => navigate('/find-lawyer')}
                />
            </div>
        </div>
    );
};

export default TriageResult;
