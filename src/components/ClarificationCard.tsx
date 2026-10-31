import React, { useState } from 'react';
import { HelpCircle, Send, FastForward, Info } from 'lucide-react';

export interface ClarificationCardProps {
  question: string;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
}

export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  question,
  onSubmit,
  onSkip,
}) => {
  const [answer, setAnswer] = useState('');

  const isBlank = answer.trim().length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlank) return;
    onSubmit(answer.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isBlank) {
      e.preventDefault();
      onSubmit(answer.trim());
    }
  };

  return (
    <div className="clarification-card fade-in">
      <div className="clarification-header">
        <div className="clarification-icon-wrapper">
          <HelpCircle size={24} className="clarification-icon" />
        </div>
        <div className="clarification-header-text">
          <span className="clarification-badge">Strike 1: Clarification Needed</span>
          <h3 className="clarification-prompt-title">Precise Jurisdiction Check</h3>
        </div>
      </div>

      <div className="clarification-question-box">
        <p className="clarification-question-text">{question}</p>
      </div>

      <form onSubmit={handleSubmit} className="clarification-form">
        <label htmlFor="clarification-input" className="clarification-label">
          Your Answer or Additional Details
        </label>
        <textarea
          id="clarification-input"
          className="clarification-textarea"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Total disputed amount is approximately ₹1,50,000, located in South Delhi..."
          rows={4}
          autoFocus
        />

        <div className="clarification-hint-row">
          <span className="clarification-hint">
            <Info size={13} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
            Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to submit
          </span>
          <span className="clarification-counter">{answer.trim().length} chars</span>
        </div>

        <div className="clarification-actions">
          <button
            type="button"
            className="btn-ghost-skip"
            onClick={onSkip}
            title="Bypass missing facts and generate brief with statutory assumptions"
          >
            <FastForward size={16} />
            <span>I don't know / Skip to draft</span>
          </button>

          <button
            type="submit"
            className="btn-primary-submit"
            disabled={isBlank}
            title={isBlank ? 'Please enter your clarification before submitting' : 'Submit clarification'}
          >
            <span>Submit Clarification</span>
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClarificationCard;
