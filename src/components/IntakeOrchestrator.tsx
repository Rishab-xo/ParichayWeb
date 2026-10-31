import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { submitPipelineBrief } from '../services/intakeApi';
import { IntakeProgressIndicator } from './IntakeProgressIndicator';
import { LegalBriefViewer } from './LegalBriefViewer';
import { Scale, Send, AlertOctagon, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import '../styles/IntakeWorkflow.css';

const EXAMPLE_DISPUTES = [
  'My landlord in South Delhi is refusing to refund my ₹65,000 security deposit after I vacated the apartment on time.',
  'Purchased a 3BHK flat from Apex Builders in Gurugram, but my father paid the 10 Lakh booking amount from his SBI account. Possession delayed by 2 years.',
  'Bank debited ₹42,000 via unauthorized fraudulent POS transaction and refused chargeback despite reporting within 24 hours.',
];

/**
 * Main visual intake component executing the Two-Pass Legal Pipeline (Pass 1 Extraction -> Pass 2 o3-mini Drafting).
 * Strictly complies with:
 * 1. Zero double-submissions (submit button strictly disabled while in flight)
 * 2. Strict payload compliance ({ userNarrative, location })
 * 3. Safe Markdown rendering via LegalBriefViewer (ReactMarkdown + remark-gfm)
 */
export const IntakeOrchestrator: React.FC = () => {
  const routerLocation = useLocation();

  const [storyInput, setStoryInput] = useState(() => {
    const passed = (routerLocation?.state as { message?: string; story?: string; narrative?: string } | null)?.message ||
                   (routerLocation?.state as { message?: string; story?: string; narrative?: string } | null)?.story ||
                   (routerLocation?.state as { message?: string; story?: string; narrative?: string } | null)?.narrative || '';
    return passed || '';
  });

  const defaultLocation = (routerLocation?.state as { location?: string } | null)?.location || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineBrief, setPipelineBrief] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isStoryBlank = storyInput.trim().length === 0;

  const handlePipelineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // GUARDRAIL 1: Zero Double-Submissions
    if (isStoryBlank || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // GUARDRAIL 2: Strict Payload Compliance (only userNarrative and location)
      const result = await submitPipelineBrief({
        userNarrative: storyInput.trim(),
        location: defaultLocation,
      });

      if (!result.brief) {
        throw new Error('Empty brief returned from legal pipeline engine.');
      }

      setPipelineBrief(result.brief);
    } catch (err: any) {
      console.error('Two-Pass pipeline intake error:', err);
      setErrorMessage(
        err.message || 'An unexpected error occurred while generating the legal battle plan. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setStoryInput(example);
  };

  const handleRestart = () => {
    setStoryInput('');
    setPipelineBrief(null);
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  return (
    <div className="intake-workflow-wrapper fade-in">
      {/* State 1: Active In-Flight Reasoning UX (10–20s Latency) */}
      {isSubmitting && <IntakeProgressIndicator mode="pipeline" />}

      {/* State 2: Complete — Safe Markdown Viewer */}
      {!isSubmitting && pipelineBrief && (
        <LegalBriefViewer generatedBrief={pipelineBrief} onRestart={handleRestart} />
      )}

      {/* State 3: Error State */}
      {!isSubmitting && !pipelineBrief && errorMessage && (
        <div className="intake-error-card fade-in" role="alert">
          <div className="error-icon-badge">
            <AlertOctagon size={28} />
          </div>
          <h3 className="error-title">Unable to Generate Legal Battle Plan</h3>
          <p className="error-message">{errorMessage}</p>
          <div className="error-actions">
            <button
              type="button"
              className="brief-btn brief-btn-primary"
              onClick={handlePipelineSubmit}
            >
              <ArrowRight size={16} />
              <span>Retry Pipeline</span>
            </button>
            <button
              type="button"
              className="brief-btn brief-btn-secondary"
              onClick={handleRestart}
            >
              <RotateCcw size={16} />
              <span>Start Over</span>
            </button>
          </div>
        </div>
      )}

      {/* State 4: Idle Intake Submission Form */}
      {!isSubmitting && !pipelineBrief && !errorMessage && (
        <div className="intake-idle-card">
          <div className="intake-card-header">
            <div className="intake-icon-badge">
              <Scale size={24} />
            </div>
            <div>
              <span className="intake-badge">Two-Pass Reasoning Pipeline • o3-mini</span>
              <h2 className="intake-card-title">Describe Your Legal Dispute</h2>
            </div>
          </div>

          <p className="intake-prompt-desc">
            Provide the facts in plain language. Detail the parties involved (who paid vs. who suffered the breach), and relevant dates and financial amounts. Our pipeline will extract structured facts, pin governing statutes from 163 Bare Acts, and formulate an aggressive, court-ready strategic battle plan.
          </p>

          <form onSubmit={handlePipelineSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="intake-narrative-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#444', marginBottom: 6 }}>
                Dispute Narrative <span style={{ color: '#e65100' }}>*</span>
              </label>
              <textarea
                id="intake-narrative-input"
                className="intake-story-textarea"
                value={storyInput}
                onChange={(e) => setStoryInput(e.target.value)}
                placeholder="e.g., I bought a flat from Apex Builders in Gurugram, but my father paid the 10 Lakh booking amount from his SBI account. The builder is 2 years delayed..."
                rows={7}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="intake-idle-footer">
              <span className="intake-counter-hint">
                {storyInput.trim().length} characters
              </span>

              {/* GUARDRAIL 1: Strictly disabled while request is in flight or story is blank */}
              <button
                type="submit"
                id="intake-submit-button"
                className="intake-submit-btn"
                disabled={isStoryBlank || isSubmitting}
                title={isStoryBlank ? 'Please describe your dispute first' : isSubmitting ? 'Reasoning in progress...' : 'Execute Two-Pass Pipeline'}
              >
                <span>{isSubmitting ? 'Reasoning with o3-mini...' : 'Synthesize Legal Battle Plan'}</span>
                <Send size={18} />
              </button>
            </div>
          </form>

          <div className="intake-suggestions">
            <p className="intake-suggestions-label">Or select a sample situation:</p>
            <div className="intake-chips-container">
              {EXAMPLE_DISPUTES.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="intake-chip"
                  disabled={isSubmitting}
                  onClick={() => handleExampleClick(example)}
                >
                  {example.substring(0, 60)}...
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntakeOrchestrator;
