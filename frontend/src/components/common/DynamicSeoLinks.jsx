import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ArrowRight, Link2, ShieldCheck, Bookmark, Compass } from 'lucide-react';
import seoLinkService from '../../services/seoLinkService';

/**
 * DynamicSeoLinks Component
 * Renders database-driven internal and external links seamlessly on public website pages.
 * Supports accessible navigation, rel attributes (nofollow, sponsored, ugc), target attributes,
 * and responsive layouts (pills, cards, list, inline).
 */
export default function DynamicSeoLinks({
  pageSlug = 'home',
  placement = null, // 'content_body' | 'related_links' | 'content_bottom' | 'sidebar' | 'footer' | null (all active)
  title = 'Helpful Resources & Verified Links',
  description = 'Explore related services, architectural case studies, and authoritative technical documentation.',
  layout = 'cards', // 'cards' | 'pills' | 'list'
  className = '',
  maxItems = 12,
}) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchLinks = async () => {
      try {
        setLoading(true);
        const res = await seoLinkService.getPublicPageLinks(pageSlug);
        if (isMounted && res.success && res.data) {
          let list = res.data.links || [];
          if (placement) {
            list = list.filter((l) => l.placement === placement);
          }
          setLinks(list.slice(0, maxItems));
        }
      } catch (err) {
        // Fail silently on public pages to avoid disrupting user experience
        if (isMounted) setLinks([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLinks();
    return () => {
      isMounted = false;
    };
  }, [pageSlug, placement, maxItems]);

  if (loading || !links || links.length === 0) {
    return null;
  }

  // ─── 1. PILLS / TAGS LAYOUT ───
  if (layout === 'pills') {
    return (
      <nav
        aria-label="Related page links"
        className={`my-6 flex flex-wrap items-center gap-2.5 ${className}`}
      >
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F3D2E] uppercase tracking-wider mr-2">
          <Link2 className="w-3.5 h-3.5 text-[#E8890C]" />
          <span>Related Topics:</span>
        </div>
        {links.map((link, idx) => {
          const isInternal = link.linkType === 'internal';
          const relValue = [
            link.relAttribute !== 'follow' ? link.relAttribute : null,
            link.targetAttribute === '_blank' ? 'noopener noreferrer' : null,
          ]
            .filter(Boolean)
            .join(' ');

          const pillClasses =
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 hover:bg-[#0F3D2E] hover:text-white text-[#0F3D2E] border border-slate-200/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E8890C]';

          return isInternal ? (
            <Link
              key={idx}
              to={link.destinationUrl}
              className={pillClasses}
              title={link.description || link.anchorText}
            >
              <span>{link.anchorText}</span>
              <ArrowRight className="w-3 h-3 opacity-60" />
            </Link>
          ) : (
            <a
              key={idx}
              href={link.destinationUrl}
              target={link.targetAttribute || '_blank'}
              rel={relValue || undefined}
              className={`${pillClasses} bg-amber-50/70 border-amber-200 text-amber-950 hover:bg-[#0F3D2E] hover:text-white`}
              title={link.description || link.anchorText}
            >
              <span>{link.anchorText}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          );
        })}
      </nav>
    );
  }

  // ─── 2. LIST LAYOUT ───
  if (layout === 'list') {
    return (
      <section
        aria-labelledby={`seo-links-${pageSlug}`}
        className={`my-8 p-6 rounded-2xl bg-[#0F3D2E]/5 border border-[#0F3D2E]/15 ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="w-4 h-4 text-[#E8890C]" />
          <h3
            id={`seo-links-${pageSlug}`}
            className="text-sm font-black uppercase tracking-wider text-[#0F3D2E]"
          >
            {title}
          </h3>
        </div>
        <ul className="space-y-2.5">
          {links.map((link, idx) => {
            const isInternal = link.linkType === 'internal';
            const relValue = [
              link.relAttribute !== 'follow' ? link.relAttribute : null,
              link.targetAttribute === '_blank' ? 'noopener noreferrer' : null,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <li key={idx} className="flex items-start gap-2.5 text-sm">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#E8890C] shrink-0" />
                <div className="flex-1 min-w-0">
                  {isInternal ? (
                    <Link
                      to={link.destinationUrl}
                      className="font-bold text-[#0F3D2E] hover:text-[#E8890C] underline decoration-[#E8890C]/40 underline-offset-4 transition-colors"
                    >
                      {link.anchorText}
                    </Link>
                  ) : (
                    <a
                      href={link.destinationUrl}
                      target={link.targetAttribute || '_blank'}
                      rel={relValue || undefined}
                      className="font-bold text-[#0F3D2E] hover:text-[#E8890C] underline decoration-[#E8890C]/40 underline-offset-4 transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>{link.anchorText}</span>
                      <ExternalLink className="w-3 h-3 text-[#E8890C] shrink-0" />
                    </a>
                  )}
                  {link.description && (
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{link.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  // ─── 3. MODERN CARDS GRID LAYOUT (DEFAULT) ───
  return (
    <section
      aria-labelledby={`seo-links-${pageSlug}`}
      className={`my-12 py-8 px-6 sm:px-8 rounded-3xl bg-slate-50/90 border border-slate-200/90 shadow-xs ${className}`}
    >
      <div className="max-w-4xl mx-auto mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 text-[#0F3D2E] text-xs font-bold uppercase tracking-wider mb-2">
          <Compass className="w-3.5 h-3.5 text-[#E8890C]" />
          <span>Curated Index & References</span>
        </div>
        <h3
          id={`seo-links-${pageSlug}`}
          className="text-xl sm:text-2xl font-black text-[#0F3D2E] tracking-tight"
        >
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link, idx) => {
          const isInternal = link.linkType === 'internal';
          const relValue = [
            link.relAttribute !== 'follow' ? link.relAttribute : null,
            link.targetAttribute === '_blank' ? 'noopener noreferrer' : null,
          ]
            .filter(Boolean)
            .join(' ');

          const CardContent = (
            <div className="h-full p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#E8890C] hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      isInternal
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isInternal ? 'Internal Resource' : link.websiteName || 'External Reference'}
                  </span>

                  {isInternal ? (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E8890C] group-hover:translate-x-1 transition-all" />
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#E8890C] transition-colors" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-[#0F3D2E] group-hover:text-[#E8890C] transition-colors line-clamp-2 leading-snug">
                  {link.anchorText}
                </h4>

                {link.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {link.description}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span className="truncate max-w-[180px] font-mono">
                  {isInternal ? link.destinationUrl : new URL(link.destinationUrl).hostname}
                </span>
                {link.relAttribute && link.relAttribute !== 'follow' && (
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    rel={link.relAttribute}
                  </span>
                )}
              </div>
            </div>
          );

          return isInternal ? (
            <Link
              key={idx}
              to={link.destinationUrl}
              className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-[#E8890C] rounded-2xl"
              title={link.anchorText}
            >
              {CardContent}
            </Link>
          ) : (
            <a
              key={idx}
              href={link.destinationUrl}
              target={link.targetAttribute || '_blank'}
              rel={relValue || undefined}
              className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-[#E8890C] rounded-2xl"
              title={link.anchorText}
            >
              {CardContent}
            </a>
          );
        })}
      </div>
    </section>
  );
}

