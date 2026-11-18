import React, { useState, useEffect } from 'react';
import { X, Target, Save, AlertCircle, Info, Loader2 } from 'lucide-react';
import seoLinkService from '../../../services/seoLinkService';

export default function PageTargetsModal({ isOpen, onClose, page, onTargetsSaved }) {
  const [formData, setFormData] = useState({
    internalLinkTarget: 5,
    externalLinkTarget: 2,
    publishedStatus: 'published',
    metaTitle: '',
    metaDescription: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (page) {
      setFormData({
        internalLinkTarget: page.internalLinkTarget ?? 5,
        externalLinkTarget: page.externalLinkTarget ?? 2,
        publishedStatus: page.publishedStatus || 'published',
        metaTitle: page.metaTitle || '',
        metaDescription: page.metaDescription || '',
      });
      setError('');
    }
  }, [page]);

  if (!isOpen || !page) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      const payload = {
        internalLinkTarget: Number(formData.internalLinkTarget) || 0,
        externalLinkTarget: Number(formData.externalLinkTarget) || 0,
        publishedStatus: formData.publishedStatus,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
      };

      const res = await seoLinkService.updatePageTargets(page._id, payload);
      if (res.success) {
        if (onTargetsSaved) onTargetsSaved(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to update page configuration');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error updating targets');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F3D2E] to-[#1E5D46] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Configure Page Targets</h2>
              <p className="text-xs text-white/80">{page.pageName} ({page.pageUrl})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
            <span>
              Target links guide the SEO health audit and warning system. Pages with fewer links than their recommended target will trigger optimization notices.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Internal Link Target
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.internalLinkTarget}
                onChange={(e) => setFormData({ ...formData, internalLinkTarget: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E]"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Current: {page.internalLinkCount || 0} links</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                External Link Target
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.externalLinkTarget}
                onChange={(e) => setFormData({ ...formData, externalLinkTarget: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E]"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Current: {page.externalLinkCount || 0} links</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Publication Status
            </label>
            <select
              value={formData.publishedStatus}
              onChange={(e) => setFormData({ ...formData, publishedStatus: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E]"
            >
              <option value="published">Published</option>
              <option value="draft">Draft / Unpublished</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Links pointing to unpublished pages trigger warning indicators.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Meta Title (Audit Reference)
            </label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              placeholder="e.g. Best VR & Web Development Agency | VR4Web"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Meta Description (Audit Reference)
            </label>
            <textarea
              rows={3}
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              placeholder="e.g. Discover immersive virtual reality and next-generation web application development services..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/20 focus:border-[#0F3D2E] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#0F3D2E] hover:bg-[#165641] disabled:opacity-50 rounded-xl shadow-sm transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Targets
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

