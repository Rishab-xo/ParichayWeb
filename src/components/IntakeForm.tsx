import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { submitPipelineBrief } from '../services/intakeApi';
import { Scale, Send, Copy, RotateCcw, Check, Sparkles } from 'lucide-react';

interface IntakeFormProps {
  initialNarrative?: string;
  initialLocation?: string;
  onSuccess?: (brief: string) => void;
}

/**
 * IntakeForm component implementing:
 * 1. Zero double-submissions (submit button strictly disabled while isReasoning is true)
 * 2. Strict payload compliance ({ userNarrative, location })
 * 3. Latency handling via isReasoning calming UI (10-20s duration)
 * 4. Hardened ReactMarkdown renderer with custom blockquote styling for dispute scripts
 */
export const IntakeForm: React.FC<IntakeFormProps> = ({
  initialNarrative = '',
  initialLocation = '',
  onSuccess,
}) => {
  const [narrative, setNarrative] = useState(initialNarrative);
  const location = initialLocation;
  const [isReasoning, setIsReasoning] = useState<boolean>(false);
  const [reasoningSeconds, setReasoningSeconds] = useState<number>(0);
  const [generatedBrief, setGeneratedBrief] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Reasoning timer to provide calming feedback during the 10-20s wait
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isReasoning) {
      setReasoningSeconds(0);
      timer = setInterval(() => {
        setReasoningSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isReasoning]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!narrative.trim() || isReasoning) return;

    setIsReasoning(true);
    setErrorMessage(null);

    try {
      // STRICT PAYLOAD COMPLIANCE: exactly two fields
      const result = await submitPipelineBrief({
        userNarrative: narrative.trim(),
        location: location.trim() || 'Gurugram',
      });

      if (!result.brief) {
        throw new Error('Empty brief returned from legal pipeline engine.');
      }

      setGeneratedBrief(result.brief);
      if (onSuccess) onSuccess(result.brief);
    } catch (err: any) {
      console.error('Pipeline reasoning failed:', err);
      setErrorMessage(
        err.message || 'An error occurred during legal reasoning. Please try again.'
      );
    } finally {
      setIsReasoning(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedBrief) return;
    try {
      await navigator.clipboard.writeText(generatedBrief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy brief:', err);
    }
  };

  const handleReset = () => {
    setNarrative('');
    setGeneratedBrief(null);
    setErrorMessage(null);
    setIsReasoning(false);
    setReasoningSeconds(0);
  };

  // State: Brief Generated - Render Hardened Markdown
  if (generatedBrief) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Action Header */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>
              Two-Pass Brief Generated • Forum Bound
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#1e293b',
                background: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy Brief'}</span>
            </button>

            <button
              onClick={handleReset}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#64748b',
                background: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={14} />
              <span>Start Over</span>
            </button>
          </div>
        </div>

        {/* Hardened Markdown Container */}
        <div
          className="prose prose-blue max-w-none p-8 bg-white border border-slate-200 rounded-xl shadow-sm"
          style={{
            padding: '32px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '16px',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
              Refirm Two-Pass Legal Reasoning Engine
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
              PRE-LITIGATION STRATEGIC ASSESSMENT — INFORMATIONAL ONLY (NOT LEGAL ADVICE)
            </div>
          </div>

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ node, ...props }) => (
                <h2
                  className="text-xl font-bold mt-6 mb-4 text-gray-900 border-b pb-2"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    marginTop: '24px',
                    marginBottom: '16px',
                    color: '#111827',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc pl-6 space-y-2 mb-4"
                  style={{ paddingLeft: '24px', marginBottom: '16px', listStyleType: 'disc' }}
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal pl-6 space-y-2 mb-4 font-semibold"
                  style={{ paddingLeft: '24px', marginBottom: '16px', listStyleType: 'decimal', fontWeight: 600 }}
                  {...props}
                />
              ),
              p: ({ node, ...props }) => (
                <p
                  style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.65, marginBottom: '12px' }}
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <li
                  style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.6, marginBottom: '6px' }}
                  {...props}
                />
              ),
              // Step 3: Hardened blockquote styling for banking dispute scripts
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-blue-500 bg-blue-50 p-4 my-4 italic text-gray-800 rounded-r-lg"
                  style={{
                    borderLeft: '4px solid #3b82f6',
                    backgroundColor: '#eff6ff',
                    padding: '16px 20px',
                    margin: '16px 0',
                    borderRadius: '0 8px 8px 0',
                    fontStyle: 'italic',
                    color: '#1f2937',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  {...props}
                />
              ),
            }}
          >
            {generatedBrief}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // State: Idle & Reasoning Form
  return (
    <div
      className="intake-form-container"
      style={{
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        padding: '24px 16px',
      }}
    >
      <div
        className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm"
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Scale size={22} />
          </div>
          <div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#2563eb',
              }}
            >
              Two-Pass Legal Reasoning • o3-mini
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Describe Your Legal Dispute
            </h2>
          </div>
        </div>

        <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
          Provide the factual narrative in plain language. If one person paid consideration and another suffered the breach, mention both parties. Our deterministic pipeline will match 163 Bare Acts and forum rules to build an authoritative brief.
        </p>

        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: '20px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.88rem',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Dispute Narrative Input */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="intake-form-narrative"
              style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}
            >
              Dispute Narrative <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              id="intake-form-narrative"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              disabled={isReasoning}
              rows={6}
              placeholder="e.g., I bought a flat from Apex Builders in Gurugram, but my father paid the 10 Lakh booking amount from his SBI account. The builder has delayed possession by 2 years without compensation..."
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '0.98rem',
                lineHeight: 1.6,
                backgroundColor: isReasoning ? '#f8fafc' : '#ffffff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Step 2: Calming Reasoning UX vs Submit Button */}
          {isReasoning ? (
            <div
              className="flex flex-col items-center justify-center p-6 space-y-4 border rounded-lg bg-blue-50/50 border-blue-100"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 246, 255, 0.7)',
                border: '1px solid #dbeafe',
                textAlign: 'center',
                gap: '12px',
              }}
            >
              <div
                className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
                style={{
                  width: '32px',
                  height: '32px',
                  border: '4px solid #2563eb',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p
                className="text-sm font-medium text-blue-800 animate-pulse"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#1e40af',
                  margin: 0,
                }}
              >
                Analyzing statutory precedents and cross-referencing jurisdictional rules... ({reasoningSeconds}s elapsed • typically 15 seconds)
              </p>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                o3-mini reasoning model is synthesizing structured facts against 163 Bare Acts
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                id="generate-brief-btn"
                disabled={!narrative.trim() || isReasoning}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: !narrative.trim() ? '#cbd5e1' : '#0f172a',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: !narrative.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <span>Generate Brief</span>
                <Send size={16} />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default IntakeForm;
