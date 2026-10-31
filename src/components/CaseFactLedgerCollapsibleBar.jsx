import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Edit3,
  Scale,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { updateFactLedger } from '../services/workspaceApi';
import '../styles/CaseFactLedgerCollapsibleBar.css';

export const CaseFactLedgerCollapsibleBar = ({
  workspace,
  factLedger,
  onLedgerUpdated,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Perspective toggle state
  const currentPerspective = workspace?.partyPerspective || 'CLAIMANT_PETITIONER';

  // Modal edit form state
  const extracted = factLedger?.extractedFacts || {};
  const ruleFacts = factLedger?.ruleEvaluationFacts || {};
  const lockedFields = factLedger?.lawyerLockedFields || [];

  const [claimantName, setClaimantName] = useState(extracted.claimant?.name || '');
  const [opName, setOpName] = useState(extracted.oppositeParties?.[0]?.name || '');
  const [disputeAmt, setDisputeAmt] = useState(ruleFacts.disputeAmount || extracted.estimatedFinancialLoss || '');
  const [locationVal, setLocationVal] = useState(ruleFacts.location || '');
  const [lockedList, setLockedList] = useState(new Set(lockedFields));
  const [selectedPersp, setSelectedPersp] = useState(currentPerspective);
  const [saving, setSaving] = useState(false);

  const toggleFieldLock = (fieldName) => {
    setLockedList((prev) => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  };

  const handlePerspectiveFlip = async (newPersp) => {
    if (!workspace?.workspaceId || newPersp === currentPerspective) return;
    try {
      const updated = await updateFactLedger(workspace.workspaceId, {
        updatedFacts: extracted,
        updatedRuleFacts: ruleFacts,
        fieldsToLock: Array.from(lockedList),
        partyPerspective: newPersp,
      });
      if (onLedgerUpdated) onLedgerUpdated(updated);
    } catch (err) {
      console.error('Failed to flip perspective:', err);
    }
  };

  const handleSaveFacts = async (e) => {
    e.preventDefault();
    if (!workspace?.workspaceId) return;
    setSaving(true);
    try {
      const updatedExtracted = {
        ...extracted,
        claimant: claimantName ? { name: claimantName, role: 'Claimant' } : extracted.claimant,
        oppositeParties: opName ? [{ name: opName, role: 'Opposite Party' }] : extracted.oppositeParties,
        estimatedFinancialLoss: disputeAmt ? Number(disputeAmt) : extracted.estimatedFinancialLoss,
      };

      const updatedRule = {
        ...ruleFacts,
        disputeAmount: disputeAmt ? Number(disputeAmt) : ruleFacts.disputeAmount,
        location: locationVal || ruleFacts.location,
      };

      const updated = await updateFactLedger(workspace.workspaceId, {
        updatedFacts: updatedExtracted,
        updatedRuleFacts: updatedRule,
        fieldsToLock: Array.from(lockedList),
        partyPerspective: selectedPersp,
      });

      if (onLedgerUpdated) onLedgerUpdated(updated);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to save facts:', err);
    } finally {
      setSaving(false);
    }
  };

  const isOpLocked = lockedFields.includes('oppositeParties') || lockedList.has('oppositeParties');
  const isAmtLocked = lockedFields.includes('disputeAmount') || lockedList.has('disputeAmount');

  return (
    <div className="case-fact-ledger-bar">
      {/* Top Header Bar */}
      <div className="ledger-bar-header">
        <div className="ledger-header-left" onClick={() => setCollapsed(!collapsed)}>
          <button className="btn-collapse-toggle">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <span className="ledger-title">Case Fact Ledger</span>
          <span className="ledger-version-pill">v{factLedger?.version || 1}</span>
          <span className="domain-pill">{extracted.domain || ruleFacts.domain || 'CONSUMER'}</span>
        </div>

        <div className="ledger-header-right">
          {/* Party Perspective Switcher [Rep: Claimant v] <-> [Rep: Opposite Party v] */}
          <div className="perspective-dropdown-wrap">
            <span className="persp-label">Perspective:</span>
            <select
              className="persp-select"
              value={currentPerspective}
              onChange={(e) => handlePerspectiveFlip(e.target.value)}
            >
              <option value="CLAIMANT_PETITIONER">Rep: Claimant / Petitioner</option>
              <option value="OPPOSITE_PARTY_RESPONDENT">Rep: Opposite Party / Respondent</option>
              <option value="NEUTRAL_EVALUATOR">Neutral Evaluator</option>
            </select>
          </div>

          <button className="btn-edit-facts" onClick={() => setShowEditModal(true)}>
            <Edit3 size={13} />
            <span>Lock / Edit Facts</span>
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!collapsed && (
        <div className="ledger-summary-grid">
          <div className="fact-cell">
            <span className="fact-label">Claimant / Client</span>
            <span className="fact-val">
              {extracted.claimant?.name || workspace?.clientName || 'Not specified'}
            </span>
          </div>

          <div className="fact-cell">
            <div className="fact-label-row">
              <span className="fact-label">Opposite Parties</span>
              {isOpLocked && (
                <span className="fact-locked-badge">
                  <Lock size={10} /> Locked
                </span>
              )}
            </div>
            <span className="fact-val">
              {extracted.oppositeParties?.[0]?.name || 'Not specified'}
            </span>
          </div>

          <div className="fact-cell">
            <div className="fact-label-row">
              <span className="fact-label">Quantified Claim</span>
              {isAmtLocked && (
                <span className="fact-locked-badge">
                  <Lock size={10} /> Locked
                </span>
              )}
            </div>
            <span className="fact-val font-semibold text-emerald-700">
              {ruleFacts.disputeAmount || extracted.estimatedFinancialLoss
                ? `₹${Number(ruleFacts.disputeAmount || extracted.estimatedFinancialLoss).toLocaleString('en-IN')}`
                : 'Not quantified'}
            </span>
          </div>

          <div className="fact-cell">
            <span className="fact-label">Location / Jurisdiction</span>
            <span className="fact-val">
              {ruleFacts.location || 'Not specified'}
            </span>
          </div>
        </div>
      )}

      {/* Edit & Lock Modal */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Lock or Edit Case Facts (Step 1.3)</h3>
              <button onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>
            <p className="modal-sub">
              Locked fields will be protected against AI overwrite across all subsequent triage passes and file uploads.
            </p>

            <form onSubmit={handleSaveFacts} className="facts-edit-form">
              <div className="form-group">
                <div className="group-label-lock">
                  <label>Claimant Name</label>
                  <button
                    type="button"
                    className={`btn-lock-field ${lockedList.has('claimant') ? 'active' : ''}`}
                    onClick={() => toggleFieldLock('claimant')}
                  >
                    {lockedList.has('claimant') ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{lockedList.has('claimant') ? 'Locked' : 'Unlocked'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="form-group">
                <div className="group-label-lock">
                  <label>Opposite Party (e.g. Workshop / Platform)</label>
                  <button
                    type="button"
                    className={`btn-lock-field ${lockedList.has('oppositeParties') ? 'active' : ''}`}
                    onClick={() => toggleFieldLock('oppositeParties')}
                  >
                    {lockedList.has('oppositeParties') ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{lockedList.has('oppositeParties') ? 'Locked' : 'Unlocked'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={opName}
                  onChange={(e) => setOpName(e.target.value)}
                  placeholder="e.g. Opposite Party / Respondent Name"
                />
              </div>

              <div className="form-group">
                <div className="group-label-lock">
                  <label>Dispute Amount (INR)</label>
                  <button
                    type="button"
                    className={`btn-lock-field ${lockedList.has('disputeAmount') ? 'active' : ''}`}
                    onClick={() => toggleFieldLock('disputeAmount')}
                  >
                    {lockedList.has('disputeAmount') ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{lockedList.has('disputeAmount') ? 'Locked' : 'Unlocked'}</span>
                  </button>
                </div>
                <input
                  type="number"
                  value={disputeAmt}
                  onChange={(e) => setDisputeAmt(e.target.value)}
                  placeholder="e.g. 500000"
                />
              </div>

              <div className="form-group">
                <label>Location / Forum</label>
                <input
                  type="text"
                  value={locationVal}
                  onChange={(e) => setLocationVal(e.target.value)}
                  placeholder="e.g. New Delhi (Commercial Court)"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Saving...' : 'Save & Lock Facts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseFactLedgerCollapsibleBar;
