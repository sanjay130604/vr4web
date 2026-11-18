import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import {
  Share2, Bookmark, ChevronRight, ArrowRight, CheckCircle2, Home,
  Copy, Check, Plus, Minus, Calendar, Clock, Sparkles
} from 'lucide-react';
import authService from '../../services/authService';
import { getImageUrl, isValidImageUrl } from '../../utils/imageUrl';
import CtaSection from '../../components/CtaSection';
import DynamicSeoLinks from '../../components/common/DynamicSeoLinks';
import NotFound from '../../components/NotFound';

/* ─────────────────────────────────────────────────────────────
   THEME : Green (#0F3D2E) + Yellow (#E8890C) + White (#FFFFFF) + Blue (#2563EB)
   FONT  : Poppins
   LAYOUT: Centered Panoramic Hero Banner + 2-Column Body with Next 2 Blogs in Sidebar
   ───────────────────────────────────────────────────────────── */

const FONT = "font-['Poppins',sans-serif]";

export default function BlogDetails() {
  const params = useParams();
  const currentSlugOrId = params.id || params.slug;
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  // Accordion Toggles (for legacy blogs)
  const [openSummary, setOpenSummary] = useState(true);
  const [openHistory, setOpenHistory] = useState(false);
  const [openPasses, setOpenPasses] = useState(true);

  // Interactive Action states
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setOpenSummary(true);
    setOpenHistory(false);
    setOpenPasses(true);

    let isMounted = true;
    const fetchLiveBlog = async () => {
      try {
        setLoading(true);
        const res = await authService.getPublicBlog(currentSlugOrId);
        if (res?.success && res.data && isMounted) {
          const d = res.data;
          setBlog({
            id: d.slug || d._id,
            slug: d.slug,
            _id: d._id,
            title: d.title,
            category: d.category || 'Technology',
            author: d.author || 'VR4Web Insights',
            readTime: d.readTime || '5 min read',
            summary: d.summary || '',
            contentType: d.contentType || (d.sections?.length > 0 ? 'manual' : 'quick'),
            content: d.content || '',
            sections: Array.isArray(d.sections) ? d.sections : [],
            featuredImage: d.featuredImage,
            cardImage: getImageUrl(d.featuredImage?.url || d.imageUrl || '/blogs/blogs-banner.png'),
            imageUrl: getImageUrl(d.featuredImage?.url || d.imageUrl || '/blogs/blogs-banner.png'),
            metaTitle: d.seo?.metaTitle || d.metaTitle || (d.title ? `${d.title} | VR4Web` : ''),
            metaDescription: d.seo?.metaDescription || d.metaDescription || d.summary || '',
            metaKeywords: d.seo?.keywords || d.metaKeywords || d.tags || [],
            canonicalUrl: d.seo?.canonicalUrl || d.canonicalUrl || `https://vr4web.com/blog/${d.slug || currentSlugOrId}`,
            ogTitle: d.seo?.ogTitle || d.ogTitle || d.seo?.metaTitle || d.metaTitle || d.title,
            ogDescription: d.seo?.ogDescription || d.ogDescription || d.seo?.metaDescription || d.metaDescription || d.summary || '',
            ogImage: getImageUrl(d.seo?.ogImage || d.ogImage || d.featuredImage?.url || d.imageUrl || '/blogs/blogs-banner.png'),
            date: d.publishedAt || d.createdAt ? new Date(d.publishedAt || d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            tags: d.tags || []
          });
        } else if (isMounted) {
          setBlog(null);
        }
      } catch (err) {
        console.warn('Live blog lookup error:', err);
        if (isMounted) setBlog(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fetchRelated = async () => {
      try {
        const res = await authService.getRelatedBlogs(currentSlugOrId);
        if (res?.success && Array.isArray(res.data) && res.data.length > 0 && isMounted) {
          setRelatedBlogs(res.data);
        } else {
          const allRes = await authService.getPublicBlogs({ status: 'published', limit: 4 });
          if (allRes?.success && Array.isArray(allRes.data) && isMounted) {
            const filtered = allRes.data.filter(
              (b) => b.slug !== currentSlugOrId && b._id !== currentSlugOrId
            ).slice(0, 2);
            setRelatedBlogs(filtered);
          }
        }
      } catch (err) {
        console.warn('Related blogs fetch error:', err);
      }
    };

    fetchLiveBlog();
    fetchRelated();
    return () => { isMounted = false; };
  }, [currentSlugOrId]);

  // Update document title and SEO meta tags
  useEffect(() => {
    if (!blog) return;
    const previousTitle = document.title;
    const pageTitle = blog.metaTitle || (blog.title ? `${blog.title} | VR4Web` : 'VR4Web Blog');
    document.title = pageTitle;

    const updateMeta = (name, property, content) => {
      if (!content) return;
      let el = null;
      if (name) el = document.querySelector(`meta[name="${name}"]`);
      if (!el && property) el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (name) el.setAttribute('name', name);
        if (property) el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const desc = blog.metaDescription || blog.summary || '';
    const keywords = Array.isArray(blog.metaKeywords) && blog.metaKeywords.length > 0
      ? blog.metaKeywords.join(', ')
      : (blog.tags || []).join(', ');
    const ogImg = getImageUrl(blog.ogImage || blog.imageUrl || '/blogs/blogs-banner.png');
    const pageUrl = blog.canonicalUrl || `https://vr4web.com/blog/${blog.slug || currentSlugOrId}`;
    const ogTitle = blog.ogTitle || pageTitle;
    const ogDesc = blog.ogDescription || desc;

    updateMeta('description', null, desc);
    updateMeta('keywords', null, keywords);
    updateMeta(null, 'og:title', ogTitle);
    updateMeta(null, 'og:description', ogDesc);
    updateMeta(null, 'og:image', ogImg);
    updateMeta(null, 'og:url', pageUrl);
    updateMeta(null, 'og:type', 'article');
    updateMeta('twitter:card', null, 'summary_large_image');
    updateMeta('twitter:title', null, ogTitle);
    updateMeta('twitter:description', null, ogDesc);
    updateMeta('twitter:image', null, ogImg);

    // Canonical link
    let canEl = document.querySelector('link[rel="canonical"]');
    if (!canEl) {
      canEl = document.createElement('link');
      canEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canEl);
    }
    canEl.setAttribute('href', pageUrl);

    // Schema.org JSON-LD
    let scriptEl = document.querySelector('script#blog-jsonld');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'blog-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': pageTitle,
      'description': desc,
      'image': ogImg,
      'url': pageUrl,
      'author': {
        '@type': 'Organization',
        'name': blog.author || 'VR4Web Technology Team',
        'url': 'https://vr4web.com'
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'VR4Web Australia Pty Ltd',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://vr4web.com/vr4web.png'
        }
      }
    });

    return () => {
      document.title = previousTitle;
      const jsonLd = document.querySelector('script#blog-jsonld');
      if (jsonLd) jsonLd.remove();
    };
  }, [blog, currentSlugOrId]);

  // Sidebar Blogs: Use live related blogs from MongoDB
  const sidebarBlogs = useMemo(() => {
    if (relatedBlogs && relatedBlogs.length > 0) {
      return relatedBlogs.map((b) => ({
        id: b.slug || b._id,
        slug: b.slug,
        title: b.title,
        category: b.category || 'Technology',
        summary: b.summary || '',
        readTime: b.readTime || '5 min read',
        date: b.publishedAt || b.createdAt ? new Date(b.publishedAt || b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        cardImage: getImageUrl(b.featuredImage?.url || b.imageUrl || '/blogs/blogs-banner.png')
      }));
    }
    return [];
  }, [relatedBlogs]);

  if (loading) {
    return (
      <div className={`${FONT} min-h-[70vh] flex flex-col items-center justify-center px-4 bg-white`}>
        <div className="w-10 h-10 border-4 border-[#E8890C] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#0F3D2E]">Loading Article...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <NotFound
        errorTitle={<>Blog Article <span className="text-[#E8890C]">Not Found</span></>}
        errorMessage="The article you are looking for may have been removed, unpublished, or renamed. Explore our latest publications and insights below."
      />
    );
  }

  const introParagraphs = blog.content?.intro || [];
  const sections = blog.content?.sections || [];

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`${FONT} w-full min-h-screen bg-[#FDFEFE] text-black selection:bg-[#E8890C] selection:text-white`}>

      {/* ════════════════ 1. CENTERED HERO BANNER ════════════════ */}
      {/* ════════════════ 1. CENTERED HERO BANNER ════════════════ */}
<section className="relative w-full pt-28 sm:pt-32 pb-14 sm:pb-16 min-h-[320px] sm:min-h-[380px] flex items-center justify-center bg-[rgb(240,231,195)] border-b border-slate-200">
  <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col items-center text-center">

    {/* Category Pill */}
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8890C] text-[#0F3D2E] text-xs font-black uppercase tracking-widest shadow-md mb-5">
      <Sparkles className="w-3.5 h-3.5" />
      <span>{blog.category}</span>
      <span>•</span>
      <span>{blog.readTime}</span>
    </div>

    {/* Main Title */}
    <motion.h1
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-black text-[#0F3D2E] tracking-tight leading-[1.15] max-w-[900px]"
    >
      {blog.title}
    </motion.h1>

    {/* Author and Date */}
    <p className="mt-5 text-xs sm:text-sm text-[#0F3D2E]/80 font-medium flex items-center justify-center gap-2">
      <span>By {blog.author}</span>
      <span>•</span>
      <span>Published {blog.date}</span>
    </p>

    {/* Breadcrumbs */}
    <nav
      aria-label="Breadcrumb"
      className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-[#0F3D2E] px-5 py-2 rounded-full shadow-sm"
    >
      <Link to="/" className="hover:text-[#E8890C] transition-colors flex items-center gap-1.5">
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      <ChevronRight className="w-3.5 h-3.5 text-white/60" />
      <Link to="/blogs" className="hover:text-[#E8890C] transition-colors">
        Blogs
      </Link>
      <ChevronRight className="w-3.5 h-3.5 text-[#E8890C]" />
      <span className="text-[#E8890C] font-extrabold">{blog.category}</span>
    </nav>
  </div>
</section>

      {/* ════════════════ 2. MAIN CONTENT + RIGHT SIDEBAR (NEXT 2 BLOGS) ════════════════ */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] gap-10 lg:gap-14 items-start">

          {/* ───────────────── LEFT: ARTICLE BODY ───────────────── */}
          <article className="min-w-0">

            {/* Featured Image Cover Banner */}
            {(blog.featuredImage?.url || blog.imageUrl || blog.cardImage) &&
              isValidImageUrl(blog.featuredImage?.url || blog.imageUrl || blog.cardImage) && (
                <figure className="mb-8 overflow-hidden rounded-2xl aspect-[16/9] sm:aspect-[21/9] border border-slate-200 bg-slate-100 shadow-md">
                  <img
                    src={getImageUrl(blog.featuredImage?.url || blog.imageUrl || blog.cardImage)}
                    alt={blog.featuredImage?.alt || blog.title}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                    onError={(e) => {
                      const fig = e.currentTarget.closest('figure');
                      if (fig) fig.style.display = 'none';
                    }}
                  />
                </figure>
              )}

            {/* Executive Summary Box */}
            {blog.summary && (
              <div className="mb-8 p-5 sm:p-6 rounded-2xl bg-[#0F3D2E]/5 border-l-4 border-[#E8890C]">
                <p className="text-xs font-black uppercase tracking-wider text-[#E8890C] mb-1.5">Overview</p>
                <p className="text-base sm:text-lg text-[#0F3D2E] font-medium leading-relaxed">
                  {blog.summary}
                </p>
              </div>
            )}

            {/* Dynamic Content Option 1: Structured Sections (Manual Fill) */}
            {blog.sections && blog.sections.length > 0 && (
              <div className="space-y-10">
                {blog.sections.map((sec, idx) => (
                  <section key={sec._id || idx} className="space-y-4 pb-8 border-b border-slate-200 last:border-b-0 last:pb-0">
                    {sec.heading && (
                      <h2 className="text-2xl sm:text-[28px] font-black text-[#0F3D2E] tracking-tight">
                        {sec.heading}
                      </h2>
                    )}
                    {sec.subheading && (
                      <p className="text-base font-bold text-[#E8890C] -mt-1">
                        {sec.subheading}
                      </p>
                    )}
                    {sec.image?.url && isValidImageUrl(sec.image.url) && (
                      <figure className="my-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                        <img
                          src={getImageUrl(sec.image.url)}
                          alt={sec.image.alt || sec.heading || ''}
                          className="w-full max-h-[460px] object-cover"
                          onError={(e) => {
                            const fig = e.currentTarget.closest('figure');
                            if (fig) fig.style.display = 'none';
                          }}
                        />
                        {sec.image.alt && sec.image.alt !== sec.heading && (
                          <figcaption className="p-3 text-xs text-slate-500 italic bg-white border-t border-slate-100">
                            {sec.image.alt}
                          </figcaption>
                        )}
                      </figure>
                    )}
                    {sec.body && (
                      <div className="text-[16.5px] sm:text-[17px] leading-[1.85] text-black space-y-4 whitespace-pre-line">
                        {sec.body}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}

            {/* Dynamic Content Option 2: Rich Text HTML (Quick Create) */}
            {blog.content && typeof blog.content === 'string' && blog.content.trim() && (!blog.sections || blog.sections.length === 0) && (
              <div 
                className="rich-blog-body py-4 text-black leading-relaxed font-sans prose prose-lg max-w-none
                  [&_h1]:text-2xl sm:[&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-[#0F3D2E] [&_h1]:mt-8 [&_h1]:mb-3
                  [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#0F3D2E] [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-slate-200 [&_h2]:pb-2
                  [&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-[#0F3D2E] [&_h3]:mt-6 [&_h3]:mb-2
                  [&_p]:text-base sm:[&_p]:text-[17px] [&_p]:leading-[1.8] [&_p]:mb-4 [&_p]:text-black
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5
                  [&_li]:text-black
                  [&_blockquote]:border-l-4 [&_blockquote]:border-[#E8890C] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-6 [&_blockquote]:bg-[#0F3D2E]/5 [&_blockquote]:p-4 [&_blockquote]:rounded-r-xl
                  [&_img]:rounded-2xl [&_img]:shadow-md [&_img]:my-6 [&_img]:max-w-full [&_img]:h-auto
                  [&_a]:text-[#E8890C] [&_a]:underline [&_a]:font-semibold"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(blog.content) }}
              />
            )}

            {/* Legacy Accordions Fallback (Only if blog has neither sections nor content) */}
            {(!blog.sections || blog.sections.length === 0) && (!blog.content || !blog.content.trim()) && (
              <div className="space-y-6">
                <div className="pb-8 border-b border-slate-200">
                  <h2 className="text-2xl font-black text-[#0F3D2E] mb-4">Summary & Overview</h2>
                  {introParagraphs.map((p, idx) => (
                    <p key={idx} className="text-[16.5px] leading-[1.85] text-black mb-4">{p}</p>
                  ))}
                </div>
                {sections.length > 0 && (
                  <div className="py-8 border-b border-slate-200 space-y-6">
                    {sections.map((sec, sIdx) => (
                      <div key={sec.id || sIdx} className="space-y-3">
                        <h3 className="text-lg font-black text-[#0F3D2E]">{sec.heading}</h3>
                        {sec.paragraphs?.map((p, pIdx) => (
                          <p key={pIdx} className="text-[16px] leading-[1.85] text-black">{p}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tag Pills */}
            {Array.isArray(blog.tags) && blog.tags.length > 0 && (
              <div className="pt-8 mt-8 border-t border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Tags & Categories
                </span>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0F3D2E]/5 text-[#0F3D2E] border border-[#0F3D2E]/10 hover:border-[#E8890C] hover:bg-[#E8890C] hover:text-white transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </article>

          {/* ───────────────── RIGHT SIDEBAR: NEXT 2 BLOGS ───────────────── */}
          <aside className="space-y-6 lg:sticky lg:top-28">

            {sidebarBlogs.length > 0 && (
              <>
                {/* Sidebar Title */}
                <div className="border-b-2 border-[#0F3D2E] pb-3 flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black text-[#0F3D2E] uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E8890C]" /> Next Articles
                  </h3>
                  <span className="text-xs font-bold text-[#E8890C] bg-[#E8890C]/10 px-2.5 py-0.5 rounded-full">
                    {sidebarBlogs.length} {sidebarBlogs.length === 1 ? 'Read' : 'Reads'}
                  </span>
                </div>

                {/* Next Blog Cards with Direct Links */}
                <div className="space-y-5">
                  {sidebarBlogs.map((b) => (
                    <Link
                      key={b.id || b.slug}
                      to={`/blog/${b.slug || b.id}`}
                      className="group block rounded-2xl overflow-hidden bg-white border-2 border-slate-200 hover:border-[#E8890C] shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      {/* Thumbnail Image */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        <img
                          src={b.cardImage}
                          alt={b.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <span className="absolute top-3 left-3 px-3 py-1 rounded-md bg-[#0F3D2E] text-white text-[11px] font-black uppercase tracking-wider shadow">
                          {b.category}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#E8890C]" />
                          <span>{b.date}</span>
                          <span>•</span>
                          <span>{b.readTime}</span>
                        </div>

                        <h4 className="text-[15px] sm:text-base font-black text-[#0F3D2E] group-hover:text-[#E8890C] transition-colors leading-snug line-clamp-2">
                          {b.title}
                        </h4>

                        <p className="mt-2 text-xs sm:text-[13px] text-black line-clamp-2 leading-relaxed">
                          {b.summary}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0F3D2E] group-hover:text-[#E8890C] transition-colors">
                          <span>Read Article</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* Quick Share / Bookmark Capsule Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                type="button"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  bookmarked ? 'bg-[#E8890C] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-[#E8890C]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-white' : ''}`} />
                <span>{bookmarked ? 'Saved' : 'Bookmark'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyUrl}
                  type="button"
                  title="Copy Link"
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#2563EB] flex items-center justify-center transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share on LinkedIn"
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#2563EB] flex items-center justify-center transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>

          </aside>

        </div>
      </main>

      {/* Dynamic SEO Links */}
      <section className="bg-slate-50/60 border-t border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DynamicSeoLinks pageSlug="blog" layout="cards" title="Related Industry Articles & External References" />
        </div>
      </section>

      {/* Global CTA Section */}
      <CtaSection />

    </div>
  );
}