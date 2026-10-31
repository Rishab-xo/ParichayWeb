import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { parseBriefAssumptions } from '../utils/intakeUtils';
import { createQuickConsult } from '../services/workspaceApi';

interface LegalBriefViewerProps {
  generatedBrief: string;
  onRestart: () => void;
}

export const LegalBriefViewer: React.FC<LegalBriefViewerProps> = ({ generatedBrief, onRestart }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { assumptions, cleanBrief } = parseBriefAssumptions(generatedBrief);

  const navigate = useNavigate();
  const [isOpeningWs, setIsOpeningWs] = useState<boolean>(false);

  const handleOpenWorkspace = async () => {
    setIsOpeningWs(true);
    try {
      const ws = await createQuickConsult('CLAIMANT_PETITIONER');
      navigate(`/workspaces/${ws.workspaceId}`);
    } catch (err: any) {
      alert('Failed to launch workspace: ' + err.message);
    } finally {
      setIsOpeningWs(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedBrief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy petition:', err);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch('/api/v1.0/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdownBrief: generatedBrief }),
      });

      if (!response.ok) {
        throw new Error(`Export failed with HTTP status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Refirm_Legal_Strategy_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      setExportError(err.message || 'Unable to generate court-ready PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold text-slate-700">Status: Triage &amp; Strategy Complete</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenWorkspace}
            disabled={isOpeningWs}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors flex items-center gap-1.5"
            style={{ backgroundColor: '#ff5722' }}
          >
            {isOpeningWs ? 'Launching...' : '⚡ Open in Legal Workspace'}
          </button>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy to Clipboard'}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {isExporting ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Compiling PDF...
              </>
            ) : (
              'Print / Export PDF'
            )}
          </button>

          <button
            onClick={onRestart}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors"
          >
            Start New Case
          </button>
        </div>
      </div>

      {exportError && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          ⚠️ {exportError}
        </div>
      )}

      {assumptions && (
        <div className="p-5 border-2 border-amber-400 bg-amber-50 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <span>⚠️</span>
            <span>Important Statutory Assumptions Made</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            Because exact jurisdictional facts were omitted or skipped, our rules engine evaluated applicable statutes under Fail-Open parameters:
          </p>
          <div className="text-xs text-amber-950 font-medium whitespace-pre-line pl-2 border-l-2 border-amber-300">
            {assumptions}
          </div>
        </div>
      )}

      <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-sm prose prose-blue max-w-none">
        <div className="border-b pb-4 mb-6 text-center">
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">Refirm Legal Drafting Engine</div>
          <div className="text-sm font-semibold text-slate-800 mt-1">PRE-LITIGATION STRATEGIC ASSESSMENT — INFORMATIONAL ONLY (NOT LEGAL ADVICE)</div>
        </div>

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            h2: ({ node, ...props }) => (
              <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900 border-b pb-2 uppercase tracking-wide" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-6 space-y-2 mb-4 font-semibold" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="text-sm text-gray-700 leading-relaxed mb-3 text-justify" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="text-sm text-gray-700 leading-relaxed" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-blue-500 bg-blue-50 p-4 my-4 italic text-gray-800 rounded-r-lg shadow-xs"
                style={{
                  borderLeft: '4px solid #3b82f6',
                  backgroundColor: '#eff6ff',
                  padding: '16px',
                  margin: '16px 0',
                  borderRadius: '0 8px 8px 0',
                  fontStyle: 'italic',
                  color: '#1f2937'
                }}
                {...props}
              />
            ),
          }}
        >
          {cleanBrief}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default LegalBriefViewer;
