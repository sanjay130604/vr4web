import { useState, useEffect } from 'react';
import {
  X,
  Link2,
  ExternalLink,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';
import seoLinkService from '../../../services/seoLinkService';

export default function AddEditLinkModal({
  isOpen,
  onClose,
  editingLink = null,
  initialPageId = null,
  pages = [],
  onSaved,
}) {
  const [formData, setFormData] = useState({
    sourcePageId: initialPageId || '',
    linkType: 'internal',
    destinationPageId: '',
    destinationUrl: '',
    anchorText: '',
    description: '',
    websiteName: '',
    placement: 'content_body',
    relAttribute: 'follow',
    targetAttribute: '_self',
    status: 'active',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (editingLink) {
      setFormData({
        sourcePageId: editingLink.sourcePageId?._id || editingLink.sourcePageId || initialPageId || '',
        linkType: editingLink.linkType || 'internal',
        destinationPageId: editingLink.destinationPageId?._id || editingLink.destinationPageId || '',
        destinationUrl: editingLink.destinationUrl || '',
        anchorText: editingLink.anchorText || '',
        description: editingLink.description || '',
        websiteName: editingLink.websiteName || '',
        placement: editingLink.placement || 'content_body',
        relAttribute: editingLink.relAttribute || 'follow',
        targetAttribute: editingLink.targetAttribute || (editingLink.linkType === 'external' ? '_blank' : '_self'),
        status: editingLink.status || 'active',
      });
    } else {
      setFormData({
        sourcePageId: initialPageId || (pages[0]?._id || ''),
        linkType: 'internal',
        destinationPageId: '',
        destinationUrl: '',
        anchorText: '',
        description: '',
        websiteName: '',
        placement: 'content_body',
        relAttribute: 'follow',
        targetAttribute: '_self',
        status: 'active',
      });
    }
    setErrors({});
    setServerError('');
  }, [editingLink, initialPageId, pages, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.sourcePageId) {
      errs.sourcePageId = 'Source page is required';
    }
    if (!formData.destinationUrl?.trim()) {
      errs.destinationUrl = 'Destination URL is required';
    } else if (formData.linkType === 'internal') {
      if (!formData.destinationUrl.trim().startsWith('/')) {
        errs.destinationUrl = 'Internal URL must begin with a forward slash (e.g. /services)';
      }
    } else {
      // External URL format
      try {
        const u = new URL(formData.destinationUrl.trim());
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          errs.destinationUrl = 'External URL must begin with http:// or https://';
        }
      } catch {
        errs.destinationUrl = 'Please enter a valid external URL (e.g. https://example.com)';
      }
    }

    if (!formData.anchorText?.trim()) {
      errs.anchorText = 'Anchor text is required';
    } else if (formData.anchorText.trim().length < 2) {
      errs.anchorText = 'Anchor text should be descriptive (at least 2 characters)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');

    try {
      if (editingLink && editingLink._id) {
        await seoLinkService.updateLink(editingLink._id, formData);
      } else {
        await seoLinkService.createLink(formData);
      }
      onSaved();
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Failed to save SEO link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDestinationPageSelect = (pageId) => {
    const selected = pages.find((p) => p._id === pageId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        destinationPageId: selected._id,
        destinationUrl: selected.pageUrl,
        anchorText: prev.anchorText || selected.pageName,
      }));
      if (errors.destinationUrl) setErrors((prev) => ({ ...prev, destinationUrl: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
              {formData.linkType === 'internal' ? <Link2 className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingLink ? 'Edit SEO Managed Link' : 'Add New SEO Managed Link'}
              </h3>
              <p className="text-xs text-slate-300">
                {formData.linkType === 'internal'
                  ? 'Connect pages within VR4Web for optimal crawl depth'
                  : 'Add authoritative external reference links with proper rel flags'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Link Type Selector Toggle */}
          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1.5">
              Link Classification Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    linkType: 'internal',
                    targetAttribute: '_self',
                    relAttribute: 'follow',
                  }))
                }
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  formData.linkType === 'internal'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Internal Link</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    linkType: 'external',
                    targetAttribute: '_blank',
                    relAttribute: 'nofollow',
                  }))
                }
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  formData.linkType === 'external'
                    ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                <span>External Link</span>
              </button>
            </div>
          </div>

          {/* Source Page Selection */}
          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1.5">
              Source Website Page <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.sourcePageId}
              onChange={(e) => {
                setFormData({ ...formData, sourcePageId: e.target.value });
                if (errors.sourcePageId) setErrors((prev) => ({ ...prev, sourcePageId: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold text-black bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 ${
                errors.sourcePageId ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300'
              }`}
            >
              <option value="">-- Select Source Page --</option>
              {pages.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.pageName} ({p.pageUrl})
                </option>
              ))}
            </select>
            {errors.sourcePageId && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.sourcePageId}</p>}
          </div>

          {/* Internal: Quick Destination Page Picker */}
          {formData.linkType === 'internal' && (
            <div>
              <label className="block text-xs font-bold text-black uppercase mb-1.5">
                Pick Registered Destination Page (Quick Select)
              </label>
              <select
                value={formData.destinationPageId || ''}
                onChange={(e) => handleDestinationPageSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-black bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Choose or type custom URL below --</option>
                {pages.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.pageName} ({p.pageUrl})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Destination URL Field */}
          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1.5">
              Destination URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.destinationUrl}
              onChange={(e) => {
                setFormData({ ...formData, destinationUrl: e.target.value });
                if (errors.destinationUrl) setErrors((prev) => ({ ...prev, destinationUrl: undefined }));
              }}
              placeholder={formData.linkType === 'internal' ? 'e.g. /services or /case-studies' : 'https://example.com/research-paper'}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold text-black bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 ${
                errors.destinationUrl ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300'
              }`}
            />
            {errors.destinationUrl && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.destinationUrl}</p>}
          </div>

          {/* External: Website Name */}
          {formData.linkType === 'external' && (
            <div>
              <label className="block text-xs font-bold text-black uppercase mb-1.5">
                External Website / Publication Name
              </label>
              <input
                type="text"
                value={formData.websiteName}
                onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                placeholder="e.g. MDN Web Docs, Google Web Dev, Forbes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-black bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          )}

          {/* Anchor Text */}
          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1.5">
              Anchor Text (Link Text) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.anchorText}
              onChange={(e) => {
                setFormData({ ...formData, anchorText: e.target.value });
                if (errors.anchorText) setErrors((prev) => ({ ...prev, anchorText: undefined }));
              }}
              placeholder="e.g. Enterprise Full-Stack Web Development Solutions"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold text-black bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600 ${
                errors.anchorText ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-300'
              }`}
            />
            {errors.anchorText && <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.anchorText}</p>}
            <p className="text-[11px] text-slate-500 mt-1">
              Descriptive anchor texts with target keywords provide stronger SEO signals than generic words like "click here".
            </p>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1.5">
              Link Context Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. High-performance enterprise web application architecture guide"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-black bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* 3-Column Placement, Rel & Target Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Placement */}
            <div>
              <label className="block text-[11px] font-bold text-black uppercase mb-1">Placement</label>
              <select
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="content_body">Content Body</option>
                <option value="content_top">Content Top</option>
                <option value="content_bottom">Content Bottom</option>
                <option value="related_links">Related Links Box</option>
                <option value="sidebar">Sidebar Widget</option>
                <option value="footer">Footer Area</option>
              </select>
            </div>

            {/* Rel Attribute */}
            <div>
              <label className="block text-[11px] font-bold text-black uppercase mb-1">Rel Attribute</label>
              <select
                value={formData.relAttribute}
                onChange={(e) => setFormData({ ...formData, relAttribute: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="follow">Follow (Dofollow)</option>
                <option value="nofollow">Nofollow</option>
                <option value="sponsored">Sponsored (Paid)</option>
                <option value="ugc">UGC (User Content)</option>
              </select>
            </div>

            {/* Target Attribute */}
            <div>
              <label className="block text-[11px] font-bold text-black uppercase mb-1">Target Tab</label>
              <select
                value={formData.targetAttribute}
                onChange={(e) => setFormData({ ...formData, targetAttribute: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-black bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="_self">Same Tab (_self)</option>
                <option value="_blank">New Tab (_blank)</option>
              </select>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <p className="text-xs font-bold text-black">Active Link Status</p>
              <p className="text-[11px] text-slate-500">Only active links are rendered on the public website.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  status: prev.status === 'active' ? 'inactive' : 'active',
                }))
              }
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                formData.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-300'
              }`}
            >
              {formData.status === 'active' ? '● Active' : '○ Inactive'}
            </button>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving & Validating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingLink ? 'Update Link' : 'Save & Audit Link'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

