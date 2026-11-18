import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Compass,
  ArrowLeft,
  Sparkles,
  Tag,
} from 'lucide-react';

export default function NotFound({
  isAdmin = false,
  isError = false,
  errorTitle,
  errorMessage,
  resetErrorBoundary,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    // Set document title
    if (isError) {
      document.title = 'Error • Page Unavailable | VR4Web';
    } else {
      document.title = isAdmin
        ? 'Admin 404 - Page Not Found | VR4Web'
        : '404 - Page Not Found | VR4Web';
    }

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isAdmin, isError]);

  // Safe back navigation: Never navigate outside of VR4Web website
  const handleGoBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(isAdmin ? '/admin' : '/');
    }
  };

  return (
    <div className="w-full bg-white text-[#111111] min-h-[calc(100vh-80px)] flex flex-col justify-center items-center overflow-x-hidden relative selection:bg-[#E8890C]/20 selection:text-[#0F3D2E]">
      {/* Subtle ambient brand gradient glows */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 pointer-events-none opacity-40 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute top-[-10%] left-[10%] w-[320px] sm:w-[480px] h-[320px] sm:h-[480px] rounded-full bg-[#0F3D2E]/5 blur-3xl" />
        <div className="absolute top-[-5%] right-[10%] w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] rounded-full bg-[#E8890C]/8 blur-3xl" />
      </div>

      {/* Main Container - beautifully centered to fill the viewport harmoniously */}
      <main className="w-full max-w-5xl mx-auto px-4 xs:px-6 sm:px-8 py-12 sm:py-16 md:py-20 relative z-10 flex flex-col justify-center items-center text-center">
        
        {/* Bold 404 Typography (clean without green icon in the 0) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="relative select-none flex items-center justify-center gap-1 sm:gap-2 leading-none py-1 sm:py-2"
        >
          {/* First "4" in VR4Web Green */}
          <span className="text-7xl xs:text-8xl sm:text-9xl md:text-[140px] lg:text-[170px] xl:text-[190px] font-black text-[#0F3D2E] tracking-tighter drop-shadow-xs">
            4
          </span>

          {/* Center "0" in VR4Web Orange (clean, no green color inside) */}
          <span className="text-7xl xs:text-8xl sm:text-9xl md:text-[140px] lg:text-[170px] xl:text-[190px] font-black text-[#E8890C] tracking-tighter drop-shadow-xs">
            0
          </span>

          {/* Second "4" in VR4Web Green */}
          <span className="text-7xl xs:text-8xl sm:text-9xl md:text-[140px] lg:text-[170px] xl:text-[190px] font-black text-[#0F3D2E] tracking-tighter drop-shadow-xs">
            4
          </span>
        </motion.div>

        {/* Primary Headline - Strictly One Line on Desktop / Tablet */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-[#0F3D2E] tracking-tight whitespace-normal sm:whitespace-nowrap mt-2 sm:mt-3 mb-3 sm:mb-4 leading-tight"
        >
          {errorTitle ? (
            errorTitle
          ) : isError ? (
            <>
              Something Went Wrong <span className="text-[#E8890C]">On This Page</span>
            </>
          ) : isAdmin ? (
            <>
              Admin Module <span className="text-[#E8890C]">Not Found</span>
            </>
          ) : (
            <>
              Lost in Digital Space? <span className="text-[#E8890C]">Page Not Found</span>
            </>
          )}
        </motion.h1>

        {/* One-Line Description in Solid Black Font */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-sm xs:text-base sm:text-lg md:text-xl text-black font-medium max-w-2xl mx-auto leading-normal mb-8 sm:mb-10"
        >
          {errorMessage ? (
            errorMessage
          ) : isError ? (
            "An unexpected issue occurred. You can easily return to our website below."
          ) : isAdmin ? (
            "The requested administrative page could not be located in the dashboard."
          ) : (
            "The page you're looking for doesn't exist or has been moved."
          )}
        </motion.p>

        {/* Action Buttons - Single line labels with balanced padding */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-2xl mx-auto"
        >
          {/* Primary Orange Button: Back to Homepage */}
          <Link
            to={isAdmin ? '/admin' : '/'}
            className="inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-[#E8890C] hover:bg-[#d07703] active:bg-[#b86702] text-white font-bold text-xs sm:text-sm md:text-base whitespace-nowrap shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 text-center shrink-0"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>{isAdmin ? 'Back to Admin Home' : 'Back to Homepage'}</span>
          </Link>

          {/* Optional Try Again button if error boundary was triggered */}
          {resetErrorBoundary && (
            <button
              onClick={() => resetErrorBoundary()}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-[#0F3D2E] hover:bg-[#14533d] text-white font-bold text-xs sm:text-sm md:text-base whitespace-nowrap shadow-md transition-all duration-200 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#E8890C] shrink-0" />
              <span>Try Again</span>
            </button>
          )}

          {/* Secondary Green Button: Explore Services */}
          {!resetErrorBoundary && (
            !isAdmin ? (
              <Link
                to="/services"
                className="inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-[#0F3D2E] hover:bg-[#14533d] active:bg-[#0a281e] text-white font-bold text-xs sm:text-sm md:text-base whitespace-nowrap shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 text-center shrink-0"
              >
                <Compass className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#E8890C]" />
                <span>Explore Services</span>
              </Link>
            ) : (
              <Link
                to="/admin/pricing"
                className="inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-[#0F3D2E] hover:bg-[#14533d] active:bg-[#0a281e] text-white font-bold text-xs sm:text-sm md:text-base whitespace-nowrap shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 text-center shrink-0"
              >
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-[#E8890C]" />
                <span>Pricing Dashboard</span>
              </Link>
            )
          )}

          {/* Tertiary Button: Safe Go Back */}
          <button
            onClick={handleGoBack}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-[#0F3D2E] border border-slate-200 font-semibold text-xs sm:text-sm md:text-base whitespace-nowrap transition-colors duration-200 cursor-pointer shrink-0 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-slate-500" />
            <span>Go Back</span>
          </button>
        </motion.div>
      </main>
    </div>
  );
}
