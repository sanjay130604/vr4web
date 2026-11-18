import { useState, useEffect } from 'react';
import {
  Globe,
  Share2,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Link as LinkIcon,
  Sparkles,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
} from 'lucide-react';
import api from '../../../services/api';
import { getImageUrl } from '../../../utils/imageUrl';

const SITE_DOMAIN = 'https://vr4web.com';

export default function SeoFormSection({
  contentType = 'case-study', // 'case-study' | 'blog'
  seoData = {},
  onChange,
  sourceTitle = '',
  sourceSummary = '',
  sourceFeaturedImage = '',
  currentId = null,
  uploadImageHandler = null,
  errors = {},
}) {
  const [keywordInput, setKeywordInput] = useState('');
  const [searchPreviewMode, setSearchPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true, message: '' });
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [showManualOgUrl, setShowManualOgUrl] = useState(false);

  // Field values with defaults
  const metaTitle = seoData.metaTitle ?? '';
  const metaDescription = seoData.metaDescription ?? '';
  const keywords = Array.isArray(seoData.keywords) ? seoData.keywords : [];
  const slug = seoData.slug ?? '';
  const canonicalUrl = seoData.canonicalUrl ?? '';
  const ogTitle = seoData.ogTitle ?? '';
  const ogDescription = seoData.ogDescription ?? '';
  const ogImage = seoData.ogImage ?? '';

  // Calculate default values based on source fields
  const defaultSlug = (sourceTitle || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const basePath = contentType === 'case-study' ? 'case-studies' : 'blog';
  const defaultCanonical = `${SITE_DOMAIN}/${basePath}/${slug || defaultSlug || 'page'}`;
  const defaultOgImage = sourceFeaturedImage || (contentType === 'case-study' ? '/case-study/property.png' : '/blogs/blogs-banner.png');

  // Slug uniqueness live check
  useEffect(() => {
    const checkSlugUniqueness = async () => {
      const activeSlug = slug.trim().toLowerCase();
      if (!activeSlug) {
        setSlugStatus({ checking: false, available: true, message: '' });
        return;
      }

      try {
        setSlugStatus((prev) => ({ ...prev, checking: true }));
        const typeParam = contentType === 'case-study' ? 'casestudy' : 'blog';
        const res = await api.get(`/sitemap/check-slug?type=${typeParam}&slug=${encodeURIComponent(activeSlug)}${currentId ? `&excludeId=${currentId}` : ''}`);
        if (res.data && res.data.success) {
          if (res.data.available) {
            setSlugStatus({ checking: false, available: true, message: 'Unique slug available' });
          } else {
            setSlugStatus({ checking: false, available: false, message: `Slug '${activeSlug}' is already taken by another item` });
          }
        }
      } catch {
        // Silent fallback
        setSlugStatus({ checking: false, available: true, message: '' });
      }
    };

    const timer = setTimeout(checkSlugUniqueness, 450);
    return () => clearTimeout(timer);
  }, [slug, contentType, currentId]);

  // Keyword Helpers
  const handleAddKeyword = (rawText) => {
    if (!rawText) return;
    const pieces = rawText
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && !keywords.includes(k));

    if (pieces.length > 0) {
      onChange({ keywords: [...keywords, ...pieces] });
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (indexToRemove) => {
    const updated = keywords.filter((_, idx) => idx !== indexToRemove);
    onChange({ keywords: updated });
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddKeyword(keywordInput);
    }
  };

  // Image Upload for OG Image
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (uploadImageHandler) {
      try {
        setUploadingOgImage(true);
        const res = await uploadImageHandler(file);
        const url = typeof res === 'string' ? res : (res?.fileUrl || res?.url);
        if (url) {
          onChange({ ogImage: url });
        }
      } catch (err) {
        console.error('OG image upload failed:', err);
      } finally {
        setUploadingOgImage(false);
      }
    } else {
      try {
        setUploadingOgImage(true);
        const formData = new FormData();
        formData.append('image', file);
        const endpoint = contentType === 'case-study' ? '/case-studies/upload-image' : '/blogs/upload-image';
        const res = await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.fileUrl) {
          onChange({ ogImage: res.data.fileUrl });
        }
      } catch (err) {
        console.error('Failed to upload OG image:', err);
      } finally {
        setUploadingOgImage(false);
      }
    }
  };

  // Helper Counters
  const metaTitleCount = metaTitle.length;
  const metaDescCount = metaDescription.length;

  return (
    <div className="space-y-6">
      {/* ─── Header Banner ─── */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Search Engine Optimization (SEO) & Social Sharing
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Control how this {contentType === 'case-study' ? 'case study' : 'blog post'} ranks on Google and renders across social shares
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Search Ready</span>
          </span>
        </div>
      </div>

      {/* ─── Two-Column Form & Previews ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Inputs, 7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. SEO Meta Title */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                SEO Meta Title <span className="text-blue-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    metaTitleCount > 60
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : metaTitleCount >= 50
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {metaTitleCount} / 60
                </span>
                {sourceTitle && metaTitle !== sourceTitle && (
                  <button
                    type="button"
                    onClick={() => onChange({ metaTitle: sourceTitle, ogTitle: ogTitle === metaTitle ? sourceTitle : ogTitle })}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reset to content title"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Use Title</span>
                  </button>
                )}
              </div>
            </div>

            <input
              type="text"
              value={metaTitle}
              onChange={(e) => onChange({ metaTitle: e.target.value })}
              placeholder={sourceTitle || 'e.g. Enterprise Web Application Development | VR4Web'}
              maxLength={70}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden transition-all ${
                errors?.metaTitle ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
              }`}
            />
            {errors?.metaTitle && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.metaTitle}</p>
            )}
            <p className="text-[11px] text-slate-500 font-medium">
              Recommended: 50–60 characters. Appears as the clickable headline on Google Search.
            </p>
          </div>

          {/* 2. SEO Meta Description */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                SEO Meta Description <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    metaDescCount > 160
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : metaDescCount >= 140
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {metaDescCount} / 160
                </span>
                {sourceSummary && metaDescription !== sourceSummary.slice(0, 160) && (
                  <button
                    type="button"
                    onClick={() => onChange({ metaDescription: sourceSummary.slice(0, 160), ogDescription: ogDescription === metaDescription ? sourceSummary.slice(0, 160) : ogDescription })}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Reset to excerpt"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Use Summary</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={3}
              value={metaDescription}
              onChange={(e) => onChange({ metaDescription: e.target.value })}
              placeholder={sourceSummary || 'A compelling summary of this deliverable to maximize Google click-through rates...'}
              maxLength={180}
              className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden transition-all leading-relaxed ${
                errors?.metaDescription ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
              }`}
            />
            {errors?.metaDescription && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.metaDescription}</p>
            )}
            <p className="text-[11px] text-slate-500 font-medium">
              Recommended: 150–160 characters. Displayed as the search snippet under your page title.
            </p>
          </div>

          {/* 3. SEO Slug */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                URL Slug <span className="text-rose-500 font-bold">*</span>
              </label>
              {slugStatus.message && (
                <span
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    slugStatus.available ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {slugStatus.available ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  <span>{slugStatus.message}</span>
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs text-slate-400 font-mono font-medium pointer-events-none select-none">
                /{basePath}/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  const cleaned = e.target.value.toLowerCase().replace(/[^\w-]/g, '');
                  onChange({
                    slug: cleaned,
                    canonicalUrl: canonicalUrl ? `${SITE_DOMAIN}/${basePath}/${cleaned}` : canonicalUrl,
                  });
                }}
                placeholder={defaultSlug || 'my-project-slug'}
                className={`w-full pl-24 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-medium focus:bg-white focus:outline-hidden transition-all ${
                  errors?.slug ? 'border-rose-500 focus:border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                }`}
              />
            </div>
            {errors?.slug && (
              <p className="mt-1 text-xs text-rose-500 font-semibold">{errors.slug}</p>
            )}
            <p className="text-[11px] text-slate-500 font-medium truncate">
              Public page URL: <span className="text-blue-600 font-mono font-bold">{SITE_DOMAIN}/{basePath}/{slug || defaultSlug || 'page'}</span>
            </p>
          </div>

          {/* 4. SEO Keywords */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                SEO Keywords & Search Queries
              </label>
              <span className="text-[11px] font-bold text-slate-500">{keywords.length} added</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Type keyword and press Enter or comma..."
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
              />
              <button
                type="button"
                onClick={() => handleAddKeyword(keywordInput)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(i)}
                      className="text-blue-500 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No keywords added yet. e.g. web development, SaaS, React</p>
            )}
          </div>

          {/* 5. Canonical URL */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Canonical URL</span>
              </label>
              <button
                type="button"
                onClick={() => onChange({ canonicalUrl: defaultCanonical })}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset to default canonical URL"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Auto-Generate</span>
              </button>
            </div>

            <input
              type="url"
              value={canonicalUrl}
              onChange={(e) => onChange({ canonicalUrl: e.target.value })}
              placeholder={defaultCanonical}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-mono font-medium focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
            />
            {canonicalUrl && !/^https?:\/\/.+/i.test(canonicalUrl) && (
              <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Canonical URL must be a valid absolute URL starting with https://</span>
              </p>
            )}
            <p className="text-[11px] text-slate-500 font-medium">
              Specifies the preferred master URL to prevent duplicate content penalties across domains.
            </p>
          </div>

          {/* 6. Open Graph & Social Media Specifics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Open Graph & Social Sharing Media
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">LinkedIn, X / Twitter & WhatsApp</span>
            </div>

            {/* OG Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Open Graph Title (Social Headline)
              </label>
              <input
                type="text"
                value={ogTitle}
                onChange={(e) => onChange({ ogTitle: e.target.value })}
                placeholder={metaTitle || sourceTitle || 'Title used when shared on social media'}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
              />
            </div>

            {/* OG Description */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Open Graph Description
              </label>
              <textarea
                rows={2}
                value={ogDescription}
                onChange={(e) => onChange({ ogDescription: e.target.value })}
                placeholder={metaDescription || sourceSummary || 'Description shown in social media preview cards'}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all leading-relaxed"
              />
            </div>

            {/* OG Image Selection & Upload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Open Graph Image (1200 × 630 px)
                </label>
                <div className="flex items-center gap-2">
                  {sourceFeaturedImage && ogImage !== sourceFeaturedImage && (
                    <button
                      type="button"
                      onClick={() => onChange({ ogImage: sourceFeaturedImage })}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Use Cover Photo</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowManualOgUrl(!showManualOgUrl)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>{showManualOgUrl ? 'Hide URL' : 'Enter URL'}</span>
                  </button>
                </div>
              </div>

              {showManualOgUrl && (
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => onChange({ ogImage: e.target.value })}
                  placeholder="https://... or /uploads/..."
                  className="w-full px-3.5 py-2 mb-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                />
              )}

              {/* Upload Drop Zone / Active Preview */}
              <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50/30 transition-colors flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-36 aspect-[1200/630] rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shrink-0 relative group">
                  <img
                    src={getImageUrl(ogImage || defaultOgImage)}
                    alt="OG Social Card Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultOgImage;
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                    1200 × 630
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {ogImage || defaultOgImage}
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingOgImage ? 'Uploading...' : 'Upload Social Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploadingOgImage}
                        className="hidden"
                      />
                    </label>

                    {ogImage && (
                      <button
                        type="button"
                        onClick={() => onChange({ ogImage: '' })}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block">Recommended aspect ratio 1.91:1 (e.g. 1200 × 630 pixels)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Previews (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* ─── Google Search Preview Card ─── */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 sticky top-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Google Search Live Preview
                </h4>
              </div>
              {/* Desktop / Mobile Switcher */}
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSearchPreviewMode('desktop')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    searchPreviewMode === 'desktop' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Desktop Search Snippet"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSearchPreviewMode('mobile')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    searchPreviewMode === 'mobile' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Mobile Search Snippet"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simulated Google Search Result */}
            <div
              className={`p-4 rounded-xl border border-slate-200/90 bg-white font-sans text-left transition-all ${
                searchPreviewMode === 'mobile' ? 'max-w-[340px] mx-auto shadow-sm' : 'w-full shadow-2xs'
              }`}
            >
              {/* Favicon & Breadcrumb */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                  V
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-slate-800 font-medium leading-none truncate">
                    VR4Web Australia
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate leading-tight">
                    {SITE_DOMAIN.replace(/^https?:\/\//, '')} › {basePath} › {slug || defaultSlug || 'item'}
                  </p>
                </div>
              </div>

              {/* Title Link */}
              <h5 className="text-[#1a0dab] hover:underline cursor-pointer text-base sm:text-lg font-medium leading-snug line-clamp-2">
                {metaTitle || sourceTitle || 'Enterprise Software & Modern Web Architecture | VR4Web'}
              </h5>

              {/* Description Snippet */}
              <p className="text-xs sm:text-[13px] text-[#4d5156] leading-relaxed mt-1 line-clamp-3">
                {metaDescription || sourceSummary || 'Discover how VR4Web delivers world-class software engineering, mobile applications, and strategic website development solutions across Australia.'}
              </p>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Google Rank Quality: <strong className="text-emerald-600">Optimal</strong></span>
              <span>AU Target</span>
            </div>

            {/* ─── Open Graph Social Media Card Preview ─── */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Social Share Card Preview</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">OG 1.91:1</span>
              </div>

              {/* Realistic Social Share Card */}
              <div className="rounded-xl overflow-hidden border border-slate-200/90 bg-slate-50 shadow-2xs group cursor-pointer">
                {/* Media Banner */}
                <div className="aspect-[1200/630] w-full bg-slate-900 relative overflow-hidden">
                  <img
                    src={getImageUrl(ogImage || defaultOgImage)}
                    alt="Social Card Visual"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultOgImage;
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider">
                    {contentType === 'case-study' ? 'Case Study' : 'Article'}
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="p-3.5 bg-white border-t border-slate-100 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                    VR4WEB.COM.AU
                  </span>
                  <h6 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 mt-0.5 group-hover:text-blue-600 transition-colors">
                    {ogTitle || metaTitle || sourceTitle || 'VR4Web Digital Showcase'}
                  </h6>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                    {ogDescription || metaDescription || sourceSummary || 'High-performance digital engineering deliverables.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
