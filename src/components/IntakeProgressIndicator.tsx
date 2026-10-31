import React, { useState, useEffect } from 'react';
import { Loader2, Scale, Sparkles, BookOpen, ShieldCheck, CheckCircle2, Clock, Cpu, FileText } from 'lucide-react';

export interface IntakeProgressIndicatorProps {
  turn?: 1 | 2;
  mode?: 'turn' | 'pipeline';
}

const TURN_2_MESSAGES = [
  'Evaluating territorial & pecuniary jurisdiction across 163 Bare Acts...',
  'Retrieving domain statutes & landmark Supreme Court precedents...',
  'Synthesizing forensic evidence protocol & banking dispute scripts...',
  'Finalizing court-ready strategic battle plan (approx. 10-18s)...',
];

const PIPELINE_STAGES = [
  {
    id: 1,
    badge: 'Pass 1: Extraction',
    model: 'gpt-4o-mini',
    title: 'Entity-Capacity Mapping & Financial Loss',
    description: 'Classifying primary claimant vs. payment instrument holder & pecuniary value...',
    minSec: 0,
    maxSec: 3,
  },
  {
    id: 2,
    badge: 'Step 2: Retrieval',
    model: 'OKF Engine • 163 Bare Acts',
    title: 'Deterministic Statutory Pinning',
    description: 'Querying 15,888 sections, limitation periods & jurisdictional rules...',
    minSec: 3,
    maxSec: 7,
  },
  {
    id: 3,
    badge: 'Step 3: Forum Binding',
    model: 'Strategy Pattern Resolver',
    title: 'Tribunal & Jurisdiction Binding',
    description: 'Deterministically locking into designated tribunal & e-filing portal...',
    minSec: 7,
    maxSec: 11,
  },
  {
    id: 4,
    badge: 'Pass 2: Reasoning',
    model: 'o3-mini Reasoning Engine',
    title: 'Synthesizing Court-Ready Legal Brief',
    description: 'Enforcing zero-hedging mandate, BSA Section 63 evidence protocols & bank scripts...',
    minSec: 11,
    maxSec: 999,
  },
];

export const IntakeProgressIndicator: React.FC<IntakeProgressIndicatorProps> = ({
  turn = 2,
  mode = 'pipeline',
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (mode !== 'turn' || turn !== 2) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % TURN_2_MESSAGES.length);
    }, 3800);

    return () => clearInterval(interval);
  }, [turn, mode]);

  if (mode === 'turn' && turn === 1) {
    return (
      <div className="intake-progress-card" role="status" aria-live="polite">
        <div className="intake-progress-visual">
          <div className="progress-glow-ring">
            <Loader2 className="progress-spinner" size={48} />
            <div className="progress-icon-badge">
              <Scale size={24} />
            </div>
          </div>
        </div>

        <div className="intake-progress-content">
          <span className="intake-step-pill">Phase 1: Legal Triage</span>
          <h3 className="intake-progress-title">Analyzing Dispute Narrative</h3>
          <p className="intake-progress-message">
            Extracting factual parameters and identifying legal domain...
          </p>
          <div className="progress-footer-note">
            <ShieldCheck size={14} className="shield-icon" />
            <span>Analyzing fact patterns for territorial &amp; pecuniary thresholds</span>
          </div>
        </div>
      </div>
    );
  }

  // Active stage for pipeline reasoning mode
  const activeStageIndex = PIPELINE_STAGES.findIndex(
    (s) => secondsElapsed >= s.minSec && secondsElapsed < s.maxSec
  );
  const currentStage = activeStageIndex === -1 ? PIPELINE_STAGES[PIPELINE_STAGES.length - 1] : PIPELINE_STAGES[activeStageIndex];
  const activeIdx = activeStageIndex === -1 ? PIPELINE_STAGES.length - 1 : activeStageIndex;

  return (
    <div className="intake-progress-card pipeline-reasoning-card" role="status" aria-live="polite">
      <div className="reasoning-header-bar">
        <div className="reasoning-model-chip">
          <Cpu size={14} />
          <span>o3-mini Reasoning Engine</span>
        </div>
        <div className="reasoning-timer-badge">
          <Clock size={14} />
          <span>{secondsElapsed}s elapsed</span>
        </div>
      </div>

      <div className="intake-progress-visual">
        <div className="progress-glow-ring reasoning-glow">
          <Loader2 className="progress-spinner reasoning-spinner" size={54} />
          <div className="progress-icon-badge reasoning-badge">
            <Sparkles size={26} />
          </div>
        </div>
      </div>

      <div className="intake-progress-content">
        <span className="intake-step-pill reasoning-pill">
          {currentStage.badge} • {currentStage.model}
        </span>
        <h3 className="intake-progress-title reasoning-title">
          {currentStage.title}
        </h3>
        <p className="intake-progress-message" key={currentStage.id}>
          {currentStage.description}
        </p>

        {/* Live Stage Pipeline Checklist */}
        <div className="reasoning-pipeline-steps">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            return (
              <div
                key={stage.id}
                className={`reasoning-step-item ${isCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-current' : ''}`}
              >
                <div className="step-item-status">
                  {isCompleted ? (
                    <CheckCircle2 size={16} className="step-icon-check" />
                  ) : isCurrent ? (
                    <Loader2 size={16} className="step-icon-spin" />
                  ) : (
                    <span className="step-dot-idle" />
                  )}
                </div>
                <div className="step-item-text">
                  <span className="step-item-badge">{stage.badge}</span>
                  <span className="step-item-title">{stage.title}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="progress-footer-note">
          <ShieldCheck size={14} className="shield-icon" />
          <span>
            Reasoning across 163 Bare Acts to enforce zero statutory conflation (typically 10–20s)
          </span>
        </div>
      </div>
    </div>
  );
};

export default IntakeProgressIndicator;
