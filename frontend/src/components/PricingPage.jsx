import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import pricingService from '../services/pricingService';
import CtaSection from './CtaSection';
import DynamicSeoLinks from './common/DynamicSeoLinks';
import {
  Tag,
  Check,
  X,
  Star,
  ArrowRight,
  Home,
  ChevronRight,
} from 'lucide-react';

export default function PricingPage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchPublicPackages = async () => {
      try {
        setLoading(true);
        const res = await pricingService.getPublicPricing();
        if (res && res.success) {
          setPackages(res.packages || []);
        } else {
          setError(res?.message || 'Failed to load pricing packages');
        }
      } catch (err) {
        console.error('Pricing page fetch error:', err);
        setError('Unable to load pricing at this moment.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPackages();
  }, []);

  const handleCtaClick = (pkg) => {
    const { ctaType, ctaLink, packageName, price } = pkg;

    if (ctaType === 'whatsapp') {
      const msg = encodeURIComponent(
        `Hi VR4Web team, I am interested in the "${packageName}" package priced at $${price}. Can you please provide more details?`
      );
      window.open(`https://wa.me/61489986622?text=${msg}`, '_blank');
      return;
    }

    if (ctaType === 'phone') {
      window.location.href = 'tel:+61489986622';
      return;
    }

    if (ctaType === 'custom' && ctaLink) {
      if (ctaLink.startsWith('http')) {
        window.open(ctaLink, '_blank');
      } else {
        navigate(ctaLink);
      }
      return;
    }

    // Default: Enquiry page with pre-filled plan
    navigate(`/get-a-quote?plan=${encodeURIComponent(packageName)}&price=${price}`);
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-[#E8890C] selection:text-white">
      {/* ─── 1. COMPACT HERO BANNER (Cream background matching Contact Us, NO green banner bg, reduced height, no icon) ─── */}
      <section className="relative w-full overflow-hidden px-4 md:px-8 pt-28 pb-8 sm:pt-32 sm:pb-10 md:pt-34 md:pb-12 bg-[rgb(240,231,195)] border-b border-slate-200">
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Badge without icon */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center px-3.5 py-1 rounded-full border border-orange-200 bg-white/90 text-[#E8890C] text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-2.5 shadow-xs"
          >
            <span>Simple and Transparent Pricing</span>
          </motion.div>

          {/* Main Heading in one responsive line */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black tracking-tight mb-3 leading-tight text-[#0F3D2E] text-center"
          >
            Choose the Right Plan for{' '}
            <span className="text-[#E8890C]">Your Business</span>
          </motion.h1>

          {/* Breadcrumbs matching Contact Us banner */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium bg-[#0F3D2E] text-white px-4 py-1.5 rounded-full shadow-md mb-4"
          >
            <Link to="/" className="flex items-center gap-1 hover:text-[#E8890C] transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-white/60" />
            <span className="font-semibold text-white">Pricing</span>
          </motion.div>

          {/* Hero Action Buttons (NO green colors) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
          >
            <a
              href="#pricing-packages"
              className="px-5 py-2.5 rounded-full bg-[#E8890C] hover:bg-[#d07703] text-white font-black text-xs sm:text-sm shadow-md shadow-[#E8890C]/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Our Packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link
              to="/get-a-quote"
              className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 text-[#111111] font-bold text-xs sm:text-sm border border-slate-300 shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Request Custom Quote</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── 2. DYNAMIC PRICING PACKAGES DISPLAY (All Packages Unified Grid - No Category Splits) ─── */}
      <section id="pricing-packages" className="py-12 sm:py-14 lg:py-18 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#E8890C] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs sm:text-sm font-bold text-black">Loading verified packages from database...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-rose-50 border border-rose-300 text-center my-10">
            <p className="text-xs sm:text-sm font-bold text-rose-950">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
            >
              Reload Page
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && packages.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-black/15 p-8 max-w-md mx-auto">
            <Tag className="w-10 h-10 text-black/40 mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-black text-black">No Packages Published Yet</h3>
            <p className="text-xs sm:text-sm text-black font-medium mt-1 max-w-sm mx-auto">
              Our administrators are updating the package tiers. Please check back shortly or request a custom proposal.
            </p>
            <Link
              to="/get-a-quote"
              className="inline-flex mt-4 px-5 py-2.5 rounded-xl bg-[#0F3D2E] text-white font-bold text-xs"
            >
              Request Custom Proposal
            </Link>
          </div>
        )}

        {/* All Packages Grid (Unified Grid - No Category Headers/Splits) */}
        {!loading && !error && packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {packages.map((pkg) => {
              const isFeatured = pkg.isFeatured || pkg.listingType === 'Featured';
              const effectiveBadge =
                pkg.badge === 'Custom'
                  ? pkg.customBadgeText
                  : pkg.badge !== 'None'
                  ? pkg.badge
                  : null;

              return (
                <div
                  key={pkg._id}
                  className={`relative rounded-3xl bg-white border transition-all duration-300 flex flex-col justify-between p-6 sm:p-7 ${
                    isFeatured
                      ? 'border-[#E8890C] shadow-[0_16px_40px_rgba(232,137,12,0.18)] ring-3 ring-[#E8890C]/20 lg:-translate-y-1.5'
                      : 'border-slate-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.1)] hover:-translate-y-1'
                  }`}
                >
                  {/* Top Badge */}
                  {effectiveBadge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span
                        className="px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md inline-block whitespace-nowrap"
                        style={{ backgroundColor: pkg.accentColor || '#E8890C' }}
                      >
                        {effectiveBadge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Package Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-black">
                        {pkg.category ? `${pkg.category} · ` : ''}{pkg.listingType || 'Standard'} Tier
                      </span>
                      {isFeatured && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-[#E8890C]">
                          <Star className="w-3.5 h-3.5 fill-[#E8890C]" />
                          Top Pick
                        </span>
                      )}
                    </div>

                    {/* Package Name */}
                    <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                      {pkg.packageName}
                    </h3>

                    {/* Tagline */}
                    {pkg.tagline && (
                      <p className="text-xs sm:text-sm font-bold text-black mt-1 leading-snug">
                        {pkg.tagline}
                      </p>
                    )}

                    {/* Description */}
                    {pkg.description && (
                      <p className="text-xs text-black font-medium mt-2 leading-relaxed line-clamp-2">
                        {pkg.description}
                      </p>
                    )}

                    {/* Price Display */}
                    <div className="mt-5 pb-5 border-b border-black/10 flex items-baseline gap-1.5">
                      <span
                        className="text-3xl sm:text-4xl font-black tracking-tight"
                        style={{ color: isFeatured ? '#E8890C' : '#0F3D2E' }}
                      >
                        ${pkg.price ? pkg.price.toLocaleString('en-US') : '0'}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-black">
                        {' '}
                        / {pkg.duration > 1 ? `${pkg.duration} ` : ''}
                        {pkg.durationType || 'Years'}
                      </span>
                    </div>

                    {/* Features List */}
                    <div className="mt-5 space-y-2.5">
                      <p className="text-[11px] font-black uppercase tracking-wider text-black">
                        Included Capabilities:
                      </p>
                      <ul className="space-y-2">
                        {pkg.features?.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                feat.isIncluded
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-black/10 text-black/50'
                              }`}
                            >
                              {feat.isIncluded ? (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              ) : (
                                <X className="w-2.5 h-2.5" />
                              )}
                            </span>
                            <span
                              className={`leading-snug ${
                                feat.isIncluded
                                  ? 'text-black font-bold'
                                  : 'text-black/40 line-through'
                              }`}
                            >
                              {feat.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-7 pt-3">
                    <button
                      type="button"
                      onClick={() => handleCtaClick(pkg)}
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 group ${
                        isFeatured
                          ? 'bg-[#E8890C] hover:bg-[#d07703] text-white shadow-[0_4px_16px_rgba(232,137,12,0.35)]'
                          : 'bg-[#0F3D2E] hover:bg-[#165a44] text-white shadow-slate-200'
                      }`}
                    >
                      <span>{pkg.buttonText || 'Get Started'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── DYNAMIC SEO LINKS ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <DynamicSeoLinks pageSlug="pricing" layout="pills" title="Helpful Investment & Consultation Resources" />
      </section>

      {/* ─── 3. BRAND CTA SECTION ─── */}
      <div className="pb-16 sm:pb-20">
        <CtaSection isHome={false} />
      </div>
    </div>
  );
}
