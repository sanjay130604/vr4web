import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageBanner from '../../components/common/PageBanner';
import CtaSection from '../../components/CtaSection';
import DynamicSeoLinks from '../../components/common/DynamicSeoLinks';
import galleryService from '../../services/galleryService';
import { getImageUrl } from '../../utils/imageUrl';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const isUnsplash = (url) => typeof url === 'string' && url.includes('images.unsplash.com');
const unsplash = (url, w) => `${url}?auto=format&w=${w}&q=75`;

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSIVE LAYOUT (16:9 Aspect Ratio, Responsive Columns: 4 Desktop, 2 Tablet, 1 Mobile)
// ─────────────────────────────────────────────────────────────────────────────

const CONTAINER =
  'relative z-10 mx-auto w-full px-4 min-[400px]:px-5 sm:px-6 lg:px-8 xl:px-10 ' +
  'max-w-[1280px] xl:max-w-[1360px] min-[1920px]:max-w-[1800px] min-[2400px]:max-w-[2100px]';

const GRID =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[2400px]:grid-cols-5 ' +
  'gap-4 sm:gap-5 lg:gap-6 min-[1920px]:gap-8';

// ─────────────────────────────────────────────────────────────────────────────
// LAZY-LOADED 16:9 IMAGE
// ─────────────────────────────────────────────────────────────────────────────

function LazyImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);

  const safeSrc = getImageUrl(src, '/banner/3.jpg');

  const sizes =
    '(min-width: 2400px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

  const imgProps = isUnsplash(safeSrc)
    ? {
        src: unsplash(safeSrc, 800),
        srcSet: [400, 600, 800, 1000, 1400].map((w) => `${unsplash(safeSrc, w)} ${w}w`).join(', '),
        sizes,
      }
    : { src: safeSrc };

  return (
    <>
      <div
        aria-hidden
        className={`absolute inset-0 bg-gray-200 ${loaded || failed ? '' : 'animate-pulse'}`}
      />
      {!failed && (
        <img
          ref={ref}
          alt={alt || 'Gallery photo'}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`gallery-image absolute inset-0 h-full w-full object-cover transition-all duration-700 group-hover:scale-105 rounded-[12px] ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            objectFit: 'cover',
            borderRadius: '12px',
          }}
          {...imgProps}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 16:9 GALLERY TILE
// ─────────────────────────────────────────────────────────────────────────────

function GalleryTile({ item, onOpen }) {
  return (
    <motion.figure
      role="button"
      tabIndex={0}
      aria-label={`Open ${item.title}`}
      onClick={() => onOpen(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item.id);
        }
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={fadeInUp}
      className="group relative m-0 aspect-[16/9] w-full min-w-0 cursor-zoom-in overflow-hidden rounded-[12px] bg-gray-100 shadow-[0_14px_32px_-20px_rgba(15,23,42,0.3)] outline-none focus-visible:ring-2 focus-visible:ring-[#E8890C] transition-all hover:shadow-lg"
      style={{
        aspectRatio: '16 / 9',
        borderRadius: '12px',
      }}
    >
      <LazyImage src={item.photo} alt={item.title} />

      {/* Dark gradient overlay on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent
                   opacity-0 transition-opacity duration-500 rounded-[12px]
                   group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
      />

      {/* Caption overlay */}
      <figcaption
        className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4 min-[1920px]:p-5
                   translate-y-3 opacity-0 transition-all duration-500
                   group-hover:translate-y-0 group-hover:opacity-100
                   group-focus-within:translate-y-0 group-focus-within:opacity-100
                   [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
      >
        <span className="mb-1.5 block h-1 w-8 rounded-full bg-[#E8890C] transition-all duration-500 group-hover:w-14" />
        <h3 className="text-sm font-extrabold leading-snug text-white sm:text-base line-clamp-1">
          {item.title}
        </h3>
        {item.caption && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-white/90 sm:text-xs line-clamp-2">
            {item.caption}
          </p>
        )}
      </figcaption>
    </motion.figure>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIGHTBOX FULL VIEWER
// ─────────────────────────────────────────────────────────────────────────────

function ArrowButton({ dir, onClick }) {
  return (
    <button
      type="button"
      aria-label={dir === 'prev' ? 'Previous image' : 'Next image'}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#0F3D2E] shadow-lg transition hover:scale-110 hover:bg-white sm:h-12 sm:w-12 cursor-pointer ${
        dir === 'prev' ? 'left-2 sm:left-5' : 'right-2 sm:right-5'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 sm:h-6 sm:w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {dir === 'prev' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
}

function Lightbox({ items, index, onClose, onChange }) {
  const touchX = useRef(null);
  const item = items[index];
  const total = items.length;

  const prev = () => onChange((index - 1 + total) % total);
  const next = () => onChange((index + 1) % total);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onChange((index - 1 + total) % total);
      else if (e.key === 'ArrowRight') onChange((index + 1) % total);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, total, onClose, onChange]);

  if (!item) return null;

  const rawSrc = getImageUrl(item.photo, '/banner/3.jpg');
  const bigSrc = isUnsplash(rawSrc) ? unsplash(rawSrc, 1600) : rawSrc;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
      }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 px-3 py-14 backdrop-blur-md sm:px-20 font-sans"
    >
      {/* Counter */}
      <div className="absolute left-4 top-4 z-20 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold text-white sm:left-6 sm:top-5">
        {index + 1} / {total}
      </div>

      {/* Close button */}
      <button
        type="button"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#0F3D2E] shadow-lg transition hover:scale-110 hover:bg-white sm:right-5 sm:top-4 sm:h-12 sm:w-12 cursor-pointer"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </button>

      {total > 1 && (
        <>
          <ArrowButton dir="prev" onClick={prev} />
          <ArrowButton dir="next" onClick={next} />
        </>
      )}

      {/* Full image preview */}
      <AnimatePresence mode="wait">
        <motion.img
          key={item.id}
          src={bigSrc}
          alt={item.title}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          className="max-h-[75vh] w-auto max-w-full rounded-2xl bg-black/50 object-contain shadow-2xl"
        />
      </AnimatePresence>

      {/* Caption info */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-4 max-w-[90vw] text-center text-white sm:max-w-[700px]"
      >
        <h3 className="text-base font-extrabold sm:text-xl text-white">{item.title}</h3>
        {item.caption && (
          <p className="mt-1 text-xs text-white/80 sm:text-sm leading-relaxed">{item.caption}</p>
        )}
      </div>
    </motion.div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC GALLERY SECTION (Fetches live from MongoDB)
// ─────────────────────────────────────────────────────────────────────────────

function GallerySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openIndex, setOpenIndex] = useState(null);

  // Fetch live published gallery items
  useEffect(() => {
    let isMounted = true;
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const res = await galleryService.getGalleryImages();
        if (res && res.success && Array.isArray(res.data) && isMounted) {
          const mapped = res.data.map((d) => ({
            id: d._id || d.id,
            title: d.title,
            caption: d.description || d.caption || '',
            category: d.category || 'General',
            photo: d.image?.url || d.imageUrl || '/banner/3.jpg',
          }));
          setItems(mapped);
        }
      } catch (err) {
        console.warn('[Gallery] Failed to fetch live gallery items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGallery();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute available categories from dynamic items
  const categories = React.useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      if (it.category && it.category.trim() && it.category !== 'General') {
        set.add(it.category.trim());
      }
    });
    return ['All', ...Array.from(set)];
  }, [items]);

  // Filter items by category
  const filtered = React.useMemo(() => {
    if (selectedCategory === 'All') return items;
    return items.filter((it) => it.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [items, selectedCategory]);

  const openById = (id) => setOpenIndex(filtered.findIndex((g) => g.id === id));

  return (
    <section className="relative w-full overflow-hidden bg-[#F8FAFC] pt-8 sm:pt-10 lg:pt-12 pb-16 sm:pb-20 lg:pb-24 font-sans">
      <div className={CONTAINER}>
        {/* Category Filter Pills (if multiple categories exist) */}
        {categories.length > 2 && (
          <div className="flex items-center justify-center flex-wrap gap-2 mb-8 sm:mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0F3D2E] text-white shadow-xs'
                    : 'bg-white text-[#64748B] hover:text-[#0F3D2E] border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className={GRID}>
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[16/9] w-full rounded-[12px] bg-slate-200 animate-pulse"
                style={{ aspectRatio: '16 / 9', borderRadius: '12px' }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#0F3D2E] flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <svg className="w-8 h-8 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#0F3D2E]">No Gallery Items Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Check back soon as our team regularly uploads high-impact client success stories and project showcases.
            </p>
          </div>
        ) : (
          /* Responsive 16:9 Grid */
          <div className={GRID}>
            {filtered.map((item) => (
              <GalleryTile key={item.id} item={item} onOpen={openById} />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {openIndex !== null && openIndex >= 0 && (
          <Lightbox
            items={filtered}
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onChange={setOpenIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Gallery() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-sans text-[#0F3D2E] selection:bg-[#E8890C] selection:text-white">
      <PageBanner
        title="Gallery"
        breadcrumbs={[{ label: 'Gallery' }]}
        bgImage="/how-we-work-banner.jpg"
        className="!mb-0 lg:!mb-0"
      />

      <GallerySection />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DynamicSeoLinks pageSlug="gallery" layout="pills" title="VR & Interactive Media Resources" />
      </section>

      <div className="[&>*]:!py-6 lg:[&>*]:!py-8 [&>*]:!my-0">
        <CtaSection />
      </div>
    </div>
  );
}
