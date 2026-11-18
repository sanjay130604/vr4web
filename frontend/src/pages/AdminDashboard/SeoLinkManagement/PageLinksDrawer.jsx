import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  RefreshCw,
  ExternalLink,
  Link2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import seoLinkService from '../../../services/seoLinkService';

export default function PageLinksDrawer({
  isOpen,
  onClose,
  page,
  onAddLink,
  onEditLink,
  onLinksChanged,
}) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [validatingId, setValidatingId] = useState(null);
  const [validatingAll, setValidatingAll] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchPageLinks = async () => {
    if (!page?._id) return;
    try {
      setLoading(true);
      setError('');
      const res = await seoLinkService.getLinks({
        sourcePageId: page._id,
        limit: 100,
      });
      if (res.success && res.data) {
        setLinks(res.data.links || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch page links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && page?._id) {
      fetchPageLinks();
    }
  }, [isOpen, page?._id]);

  if (!isOpen || !page) return null;

  const handleValidateSingle = async (linkId) => {
    try {
      setValidatingId(linkId);
      const res = await seoLinkService.validateLink(linkId);
      if (res.success && res.data) {
        setLinks((prev) => prev.map((l) => (l._id === linkId ? res.data : l)));
        if (onLinksChanged) onLinksChanged();
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Validation failed');
    } finally {
      setValidatingId(null);
    }
  };

  const handleValidateAll = async () => {
    try {
      setValidatingAll(true);
      await seoLinkService.validateAllLinks(page._id);
      await fetchPageLinks();
      if (onLinksChanged) onLinksChanged();
    } catch (err) {
      alert(err?.response?.data?.message || 'Batch validation failed');
    } finally {
      setValidatingAll(false);
    }
  };

  const handleDelete = async (linkId) => {
    if (!window.confirm('Are you sure you want to remove this SEO link?')) return;
    try {
      await seoLinkService.deleteLink(linkId);
      setLinks((prev) => prev.filter((l) => l._id !== linkId));
      if (onLinksChanged) onLinksChanged();
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed');
    }
  };

  // Filter links
  const filteredLinks = links.filter((l) => {
    if (filterType !== 'all' && l.linkType !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const anchor = (l.anchorText || '').toLowerCase();
      const url = (l.destinationUrl || '').toLowerCase();
      if (!anchor.includes(q) && !url.includes(q)) return false;
    }
    return true;
  });

  const getValidationBadge = (l) => {
    switch (l.validationStatus) {
      case 'working':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Working {l.httpStatusCode ? `(${l.httpStatusCode})` : ''}
          </span>
        );
      case 'broken':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Broken {l.httpStatusCode ? `(${l.httpStatusCode})` : ''}
          </span>
        );
      case 'redirected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw className="w-3 h-3 text-amber-600" />
            Redirect ({l.httpStatusCode || 301})
          </span>
        );
      case 'temporary_error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Clock className="w-3 h-3 text-orange-600" />
            Timeout / Temp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300">
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-[#0F3D2E] to-[#1E5D46] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Manage Page Links</h2>
              <p className="text-xs text-white/80">
                {page.pageName} &bull; <span className="underline">{page.pageUrl}</span>
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

        {/* Action Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search anchor or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="internal">Internal Links</option>
              <option value="external">External Links</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleValidateAll}
              disabled={validatingAll || links.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${validatingAll ? 'animate-spin' : ''}`} />
              Validate All
            </button>
            <button
              onClick={() => onAddLink && onAddLink(page._id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0F3D2E] hover:bg-[#165641] rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Link
            </button>
          </div>
        </div>

        {/* Links List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0F3D2E]" />
              <p className="text-xs">Loading links for {page.pageName}...</p>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <Link2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No links found</p>
              <p className="text-xs text-slate-400 mt-1">
                {links.length === 0
                  ? 'No links have been configured for this page yet.'
                  : 'No links match your current search and filter.'}
              </p>
              <button
                onClick={() => onAddLink && onAddLink(page._id)}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0F3D2E] rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Link
              </button>
            </div>
          ) : (
            filteredLinks.map((link) => (
              <div
                key={link._id}
                className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          link.linkType === 'internal'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {link.linkType === 'internal' ? (
                          <Link2 className="w-3 h-3" />
                        ) : (
                          <ExternalLink className="w-3 h-3" />
                        )}
                        {link.linkType}
                      </span>

                      {getValidationBadge(link)}

                      {link.isDuplicate && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldAlert className="w-3 h-3" />
                          Duplicate
                        </span>
                      )}

                      <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded">
                        Placement: {link.placement?.replace('_', ' ')}
                      </span>

                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded">
                        rel="{link.relAttribute}"
                      </span>

                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded">
                        target="{link.targetAttribute}"
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 break-words">
                      "{link.anchorText}"
                    </h4>

                    <a
                      href={link.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 break-all"
                    >
                      {link.destinationUrl}
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>

                    {link.description && (
                      <p className="text-xs text-slate-500 italic">{link.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleValidateSingle(link._id)}
                      disabled={validatingId === link._id}
                      title="Validate Link Live"
                      className="p-1.5 text-slate-500 hover:text-[#0F3D2E] hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${validatingId === link._id ? 'animate-spin' : ''}`}
                      />
                    </button>
                    <button
                      onClick={() => onEditLink && onEditLink(link)}
                      title="Edit Link"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(link._id)}
                      title="Delete Link"
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{filteredLinks.length}</strong> of <strong>{links.length}</strong> links
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

