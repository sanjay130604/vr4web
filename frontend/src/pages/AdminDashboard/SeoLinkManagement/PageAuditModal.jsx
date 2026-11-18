import React, { useState } from 'react';
import {
  X,
  Award,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  FileText,
  ExternalLink,
  Link2,
} from 'lucide-react';
import seoLinkService from '../../../services/seoLinkService';

export default function PageAuditModal({ isOpen, onClose, page, onAuditUpdated }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [auditData, setAuditData] = useState(page?.lastAudit || null);
  const [error, setError] = useState('');

  // Keep state synced with prop
  React.useEffect(() => {
    setAuditData(page?.lastAudit || null);
    setError('');
  }, [page]);

  if (!isOpen || !page) return null;

  const handleRunAudit = async () => {
    try {
      setAnalyzing(true);
      setError('');
      const res = await seoLinkService.analyzePage(page._id);
      if (res.success && res.data) {
        setAuditData(res.data);
        if (onAuditUpdated) onAuditUpdated(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Audit analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const score = auditData?.score ?? page?.seoScore ?? 0;

  const getScoreBadge = (sc) => {
    if (sc >= 90) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (sc >= 75) return { label: 'Good', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (sc >= 50) return { label: 'Needs Improvement', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Poor', color: 'text-red-700 bg-red-50 border-red-200' };
  };

  const scoreBadge = getScoreBadge(score);

  const factorList = [
    { key: 'internalCoverage', label: 'Internal Link Coverage', max: 25, score: auditData?.factors?.internalCoverage ?? Math.min(25, Math.round(((page.internalLinkCount || 0) / (page.internalLinkTarget || 1)) * 25)) },
    { key: 'externalQuality', label: 'External Link Quality & Relevance', max: 15, score: auditData?.factors?.externalQuality ?? Math.min(15, Math.round(((page.externalLinkCount || 0) / (page.externalLinkTarget || 1)) * 15)) },
    { key: 'metaTitle', label: 'Meta Title Structure & Length', max: 15, score: auditData?.factors?.metaTitle ?? 15 },
    { key: 'metaDescription', label: 'Meta Description Optimization', max: 10, score: auditData?.factors?.metaDescription ?? 10 },
    { key: 'headingStructure', label: 'Heading Structure (H1, H2, H3)', max: 10, score: auditData?.factors?.headingStructure ?? 10 },
    { key: 'imageAltText', label: 'Image Alt Text Accessibility', max: 10, score: auditData?.factors?.imageAltText ?? 10 },
    { key: 'urlStructure', label: 'URL Slug Structure & Readability', max: 5, score: auditData?.factors?.urlStructure ?? 5 },
    { key: 'contentQuality', label: 'Content Depth & Word Count', max: 10, score: auditData?.factors?.contentQuality ?? 10 },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F3D2E] to-[#1E5D46] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                SEO Audit Score Breakdown
              </h2>
              <p className="text-xs text-white/80">
                Page: <span className="font-semibold text-white">{page.pageName}</span> ({page.pageUrl})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Score Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 rounded-full flex items-center justify-center border-4 border-slate-200 bg-white shadow-inner">
                <div className="text-center">
                  <span className="text-3xl font-black text-slate-900 leading-none">{score}</span>
                  <span className="text-[10px] block text-slate-500 font-semibold uppercase tracking-wider">/ 100</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${scoreBadge.color}`}>
                    {scoreBadge.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    Health: <strong className="capitalize text-slate-700">{page.linkHealth || 'Healthy'}</strong>
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  100-Point Algorithmic SEO Audit
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                  Calculated using 8 granular factor weights, target compliance, and deductions for broken or duplicate links.
                </p>
              </div>
            </div>

            <button
              onClick={handleRunAudit}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#0F3D2E] hover:bg-[#165641] disabled:opacity-50 rounded-xl shadow-sm transition whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Re-Analyzing...' : 'Run Live Audit'}
            </button>
          </div>

          {/* Disclaimer Notice */}
          <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Notice:</strong> This is an internal technical audit score calculated against best-practice SEO metrics and your configured targets. It is an internal benchmark, not an official Google ranking score.
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Internal Links</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-slate-900">{page.internalLinkCount || 0}</span>
                <span className="text-xs text-slate-400">/ {page.internalLinkTarget || 0} target</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">External Links</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-slate-900">{page.externalLinkCount || 0}</span>
                <span className="text-xs text-slate-400">/ {page.externalLinkTarget || 0} target</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Broken Links</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl font-bold ${(auditData?.brokenLinks || page.brokenLinksCount) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {auditData?.brokenLinks ?? page.brokenLinksCount ?? 0}
                </span>
                <span className="text-xs text-slate-400">issues</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block">Duplicate Links</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl font-bold ${(auditData?.duplicateLinks || page.duplicateLinksCount) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {auditData?.duplicateLinks ?? page.duplicateLinksCount ?? 0}
                </span>
                <span className="text-xs text-slate-400">flagged</span>
              </div>
            </div>
          </div>

          {/* Granular Factors Breakdown */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0F3D2E]" />
              Factor-by-Factor Score Breakdown
            </h4>
            <div className="space-y-3">
              {factorList.map((f) => {
                const pct = Math.round((f.score / f.max) * 100);
                return (
                  <div key={f.key} className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700">{f.label}</span>
                      <span className="text-slate-900 font-bold">
                        {f.score} / {f.max} pts
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          pct >= 90
                            ? 'bg-emerald-500'
                            : pct >= 70
                            ? 'bg-blue-500'
                            : pct >= 40
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0F3D2E]" />
              Actionable SEO Recommendations
            </h4>
            {auditData?.recommendations && auditData.recommendations.length > 0 ? (
              <div className="space-y-2">
                {auditData.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-start gap-2.5 text-slate-700"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All link requirements are currently well balanced! Keep monitoring targets.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Last Analyzed:{' '}
            {auditData?.analyzedAt
              ? new Date(auditData.analyzedAt).toLocaleString()
              : page.lastAnalyzedAt
              ? new Date(page.lastAnalyzedAt).toLocaleString()
              : 'Never'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

