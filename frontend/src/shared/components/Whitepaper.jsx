import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ChevronRight,
  Home,
  Download,
  CheckCircle2,
  Loader2,
  Clock,
  Bell,
  X,
  Search,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import newspaperService from '../../services/newspaperService';
import { getImageUrl } from '../../utils/imageUrl';
import CtaSection from '../../components/CtaSection';

// ─────────────────────────────────────────────────────────────────────────────
// COLOURS:
//   GREEN  = #0F3D2E
//   YELLOW = #E8890C
//   WHITE  = #FFFFFF
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_IMG =
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80';

const EASE = [0.22, 1, 0.36, 1];

const imgFallback = (e) => {
  if (e.currentTarget.src !== FALLBACK_IMG) e.currentTarget.src = FALLBACK_IMG;
};

// Helper: Format bytes into readable string (e.g. 2.4 MB)
function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/* ───────── LEFT: one newspaper row (image left, text right) ───────── */
function PaperRow({ paper, state, onAction }) {
  const reduce = useReducedMotion();
  const busy = state === 'downloading';
  const done = state === 'completed';

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="group grid grid-cols-1 sm:grid-cols-[minmax(0,320px)_1fr] lg:grid-cols-[minmax(0,300px)_1fr] gap-5 sm:gap-7 items-center pb-6 mb-6 border-b border-[#0F3D2E]/10 last:border-b-0 last:mb-0 last:pb-0"
    >
      {/* Image */}
      <button
        type="button"
        onClick={() => onAction(paper)}
        aria-label={
          paper.isAvailable
            ? `Download newspaper publication: ${paper.title}`
            : `${paper.title} — coming soon`
        }
        className="relative block w-full overflow-hidden rounded-md aspect-[4/3] bg-slate-100 shadow-[0_18px_40px_-20px_rgba(15,61,46,0.35)] outline-none focus-visible:ring-4 focus-visible:ring-[#E8890C]/40 cursor-pointer"
      >
        <img
          src={paper.image || FALLBACK_IMG}
          alt={paper.title}
          loading="lazy"
          onError={imgFallback}
          className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07] ${
            paper.isAvailable ? '' : 'grayscale-[40%]'
          }`}
        />
        {/* Soft dark gradient overlay */}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#0F3D2E]/75 via-transparent to-[#0F3D2E]/25"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-[#0F3D2E] shadow-sm">
          {paper.category || 'Editorial Publication'}
        </span>
        <span className="absolute bottom-2.5 right-3 text-[11px] font-semibold text-white drop-shadow">
          {paper.isAvailable ? `PDF · ${paper.fileSize || 'Free Download'}` : 'PDF Coming Soon'}
        </span>
      </button>

      {/* Text */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
          <span
            className={`inline-block rounded-full px-3.5 py-1 text-xs font-bold ${
              paper.isAvailable
                ? 'bg-[#E8890C] text-white'
                : 'border border-[#0F3D2E]/30 bg-white text-[#0F3D2E]'
            }`}
          >
            {paper.status || 'Free PDF'}
          </span>
          <span className="font-medium text-black">{paper.category || 'Research & Insights'}</span>
        </div>

        <h3 className="mt-3 text-2xl sm:text-[26px] font-extrabold tracking-tight leading-tight text-[#0F3D2E] transition-colors duration-300 group-hover:text-[#E8890C]">
          {paper.title}
        </h3>

        <p className="mt-3 text-[15px] leading-relaxed text-black line-clamp-3 max-w-[520px]">
          {paper.description}
        </p>

        <button
          type="button"
          onClick={() => onAction(paper)}
          disabled={busy}
          className="mt-4 inline-flex items-center gap-2 border-b-2 border-[#E8890C] pb-0.5 text-sm font-bold text-[#0F3D2E] transition-colors duration-300 hover:text-[#E8890C] disabled:cursor-wait disabled:opacity-80 cursor-pointer"
        >
          {paper.isAvailable ? (
            <>
              {!busy && !done && (
                <>
                  Download Newspaper PDF
                  <Download className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                </>
              )}
              {busy && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing Download...
                </>
              )}
              {done && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Downloaded successfully!
                </>
              )}
            </>
          ) : (
            <>
              Notify me
              <Bell className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}

/* ───────── RIGHT: one item of the "all newspapers" list ───────── */
function SidebarItem({ paper, index, onAction }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.06, ease: EASE }}
      className="min-w-0 border-b border-[#0F3D2E]/10 last:border-b-0 py-4 first:pt-0 last:pb-0"
    >
      <button
        type="button"
        onClick={() => onAction(paper)}
        aria-label={
          paper.isAvailable
            ? `Download newspaper publication: ${paper.title}`
            : `${paper.title} — coming soon`
        }
        className="group flex w-full min-w-0 items-center gap-4 text-left outline-none focus-visible:ring-4 focus-visible:ring-[#E8890C]/40 rounded-md cursor-pointer"
      >
        <div className="h-[92px] w-[84px] flex-shrink-0 overflow-hidden rounded-md bg-slate-100">
          <img
            src={paper.image || FALLBACK_IMG}
            alt=""
            loading="lazy"
            onError={imgFallback}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              paper.isAvailable ? '' : 'grayscale-[40%]'
            }`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-black">
            {paper.isAvailable ? (
              <Download className="h-3.5 w-3.5 text-[#E8890C]" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-[#E8890C]" />
            )}
            {paper.status || 'Free PDF'}
          </p>
          <h4 className="mt-1 text-[16px] font-extrabold leading-snug text-[#0F3D2E] line-clamp-3 break-words transition-colors duration-300 group-hover:text-[#E8890C]">
            {paper.title}
          </h4>
        </div>
      </button>
    </motion.div>
  );
}

export default function Whitepaper() {
  const [newspapers, setNewspapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [download, setDownload] = useState({ id: null, state: 'idle' }); // 'idle' | 'downloading' | 'completed'
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch Live Published Newspapers from MongoDB
  useEffect(() => {
    let isMounted = true;
    const fetchLiveNewspapers = async () => {
      try {
        setLoading(true);
        const res = await newspaperService.getNewspapers({ limit: 50 });
        if (res && res.success && Array.isArray(res.data) && isMounted) {
          const normalized = res.data.map((item) => {
            const hasPdf = Boolean(item.pdf?.url || item.pdfUrl);
            const pdfUrl = item.pdf?.url || item.pdfUrl || '';
            const fileName = item.pdf?.fileName || item.fileName || 'VR4Web-Publication.pdf';
            const sizeStr = formatFileSize(item.pdf?.fileSize || item.fileSize);

            return {
              id: item._id,
              _id: item._id,
              title: item.title,
              description: item.description || item.summary || '',
              image: getImageUrl(item.image?.url || item.imageUrl, '/white-paper.png'),
              pdfUrl: pdfUrl ? getImageUrl(pdfUrl) : '',
              fileName,
              fileSize: sizeStr,
              isAvailable: hasPdf,
              category: 'Editorial & Pricing',
              status: hasPdf ? 'Free PDF' : 'Coming Soon',
            };
          });

          setNewspapers(normalized);
        }
      } catch (err) {
        console.warn('Error fetching live newspapers, using fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveNewspapers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter newspapers by live search
  const filteredNewspapers = useMemo(() => {
    if (!searchQuery.trim()) return newspapers;
    const q = searchQuery.toLowerCase().trim();
    return newspapers.filter(
      (n) =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.description || '').toLowerCase().includes(q)
    );
  }, [newspapers, searchQuery]);

  // ─── Automatic download with confetti ───
  const handleDownload = (paper) => {
    if (download.state === 'downloading') return;

    if (!paper.pdfUrl) {
      showComingSoonToast(paper.title);
      return;
    }

    setDownload({ id: paper.id, state: 'downloading' });

    try {
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.75 },
        colors: ['#0F3D2E', '#E8890C', '#9fd3bd', '#ffffff'],
      });
    } catch (e) {
      // ignore if confetti fails
    }

    setTimeout(() => {
      const link = document.createElement('a');
      link.href = paper.pdfUrl;
      link.download = paper.fileName || 'VR4Web-Newspaper-Publication.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownload({ id: paper.id, state: 'completed' });

      setTimeout(() => setDownload({ id: null, state: 'idle' }), 3500);
    }, 900);
  };

  const showComingSoonToast = (title) => {
    setToastMessage(`"${title}" is currently in final review and will be released shortly.`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleAction = (paper) => {
    if (paper.isAvailable && paper.pdfUrl) {
      handleDownload(paper);
    } else {
      showComingSoonToast(paper.title);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white font-sans text-[#0F3D2E] selection:bg-[#0F3D2E] selection:text-white">
      {/* ─── 1. HERO ─── */}
      <section className="relative w-full overflow-hidden px-4 md:px-8 pt-32 pb-8 md:pt-36 md:pb-9 bg-[rgb(240,231,195)] border-b border-slate-200">
        <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 leading-tight text-[#0F3D2E]"
          >
            Actionable Insights &amp; <span className="text-[#E8890C]">Newspaper Editions</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium bg-[#0F3D2E] text-white px-4 py-1.5 rounded-full shadow-md"
          >
            <Link to="/" className="flex items-center gap-1 hover:text-[#E8890C] transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            <span className="font-semibold">Newspapers &amp; Whitepapers</span>
          </motion.div>
        </div>
      </section>

      {/* ─── 2. NEWSPAPER LIST (left: one by one) + SIDEBAR (right: all publications) ─── */}
      <section className="py-8 md:py-10 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <span className="inline-block px-4 py-1 rounded-full bg-[#E8890C]/15 border border-[#E8890C] text-[#0F3D2E] text-sm font-bold mb-4">
            Official Publications
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="text-[#0F3D2E]">Expert Guides,</span>{' '}
            <span className="text-[#E8890C]">Real Results</span>
          </h2>

          <p className="text-black text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            In-depth newspaper editions, pricing breakdowns, and strategic industry guides — written
            for modern businesses.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search newspaper publications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#0F3D2E] focus:ring-1 focus:ring-[#0F3D2E] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-12 items-start">
          {/* LEFT: newspapers appear one by one as you scroll */}
          <div>
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 text-[#E8890C] animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#0F3D2E]">Loading publications...</p>
              </div>
            ) : filteredNewspapers.length > 0 ? (
              filteredNewspapers.map((paper) => (
                <PaperRow
                  key={paper.id}
                  paper={paper}
                  state={download.id === paper.id ? download.state : 'idle'}
                  onAction={handleAction}
                />
              ))
            ) : (
              <div className="py-16 text-center border rounded-2xl border-dashed border-slate-200 bg-slate-50/50">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-bold text-[#0F3D2E] mb-1">No publications found</p>
                <p className="text-xs text-slate-500 mb-4">
                  {searchQuery
                    ? `No publications matched "${searchQuery}".`
                    : 'Check back soon for new releases.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-bold hover:bg-[#E8890C] transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: sidebar showing all publications (stays in view while you scroll) */}
          <aside className="lg:sticky lg:top-28 space-y-8">
            <div className="rounded-lg border border-[#0F3D2E]/10 bg-white p-6 shadow-[0_18px_40px_-24px_rgba(15,61,46,0.35)]">
              <div className="mb-5">
                <h3 className="text-xl font-extrabold tracking-tight text-[#0F3D2E]">
                  All Publications
                </h3>
                <span className="mt-2 block h-[3px] w-12 rounded-full bg-[#E8890C]" />
              </div>

              <div className="max-h-[560px] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {newspapers.map((paper, i) => (
                  <SidebarItem key={paper.id} paper={paper} index={i} onAction={handleAction} />
                ))}
              </div>
            </div>

            {/* Quick Contact / Request Capsule */}
            <div className="rounded-lg border border-[#0F3D2E]/10 bg-gradient-to-br from-[#0F3D2E]/5 to-[#E8890C]/10 p-6 shadow-sm">
              <h4 className="text-base font-black text-[#0F3D2E] mb-2">Need a Custom Report?</h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Our technology specialists conduct custom benchmark audits and pricing roadmaps for
                enterprises.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#0F3D2E] hover:text-[#E8890C] transition-colors border-b border-[#0F3D2E] pb-0.5"
              >
                <span>Request Custom Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* ─── 3. TOAST ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-6 lg:right-10 z-50 max-w-md bg-[#0F3D2E] text-white p-4 rounded-2xl shadow-2xl border border-white/20 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-[#E8890C] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">
                Publication Notice
              </h4>
              <p className="text-xs text-white/90 leading-relaxed font-normal">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              aria-label="Close"
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 4. CTA ─── */}
      <CtaSection />
    </div>
  );
}
