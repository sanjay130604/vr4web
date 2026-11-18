import { useEffect, useRef, useState } from 'react';

/**
 * WidgetCraft Social Icons Widget
 * Embed ID: 11 (VR4Web)
 * API Base: https://backend.ormconsult.com
 */

// Fallback icons data from WidgetCraft API #11
const DEFAULT_ICONS = [
  {
    id: 502,
    platform: 'instagram',
    url: 'https://www.instagram.com/vr4web/',
    tooltip: 'Instagram',
  },
  {
    id: 503,
    platform: 'facebook',
    url: 'https://www.facebook.com/profile.php?id=61551828023917',
    tooltip: 'Facebook',
  },
  {
    id: 504,
    platform: 'linkedin',
    url: 'https://www.linkedin.com/company/143644117/',
    tooltip: 'LinkedIn',
  },
  {
    id: 505,
    platform: 'youtube',
    url: 'https://www.youtube.com/@VR4WebSolutions',
    tooltip: 'YouTube',
  },
];

// Clean SVGs for each platform matching WidgetCraft official styles
const PLATFORM_ICONS = {
  instagram: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-5 h-5">
      <path d="M349.33 69.33a93.62 93.62 0 0 1 93.34 93.34v186.66a93.62 93.62 0 0 1-93.34 93.34H162.67a93.62 93.62 0 0 1-93.34-93.34V162.67a93.62 93.62 0 0 1 93.34-93.34h186.66m0-37.33H162.67C90.8 32 32 90.8 32 162.67v186.66C32 421.2 90.8 480 162.67 480h186.66C421.2 480 480 421.2 480 349.33V162.67C480 90.8 421.2 32 349.33 32z" />
      <path d="M256 149.33c-58.8 0-106.67 47.87-106.67 106.67S197.2 362.67 256 362.67 362.67 314.8 362.67 256 314.8 149.33 256 149.33zm0 176c-38.27 0-69.33-31.06-69.33-69.33s31.06-69.33 69.33-69.33 69.33 31.06 69.33 69.33-31.06 69.33-69.33 69.33zm114.67-184a24 24 0 1 1-24-24 24 24 0 0 1 24 24z" />
    </svg>
  ),
  facebook: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="w-5 h-5">
      <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" />
    </svg>
  ),
  linkedin: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="w-4.5 h-4.5">
      <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z" />
    </svg>
  ),
  youtube: (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" className="w-5 h-5">
      <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.583V174.334l142.069 81.666-142.069 81.666z" />
    </svg>
  ),
};

// Platform Official Brand Background Colors
const PLATFORM_COLORS = {
  instagram: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white',
  facebook: 'bg-[#1877F2] text-white',
  linkedin: 'bg-[#0A66C2] text-white',
  youtube: 'bg-[#FF0000] text-white',
};

export default function WidgetcraftSocialIcons({ className = '', align = 'start' }) {
  const mountRef = useRef(null);
  const [icons, setIcons] = useState(DEFAULT_ICONS);
  const [styleConfig, setStyleConfig] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch live social icons configuration from WidgetCraft API Base
    fetch('https://backend.ormconsult.com/api/public/widgets/11?type=social_icons')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch WidgetCraft social icons');
        return res.json();
      })
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.layout_json?.icons?.length) {
          setIcons(data.layout_json.icons.filter((icon) => icon.enabled !== false));
        }
        if (data.style_json) {
          setStyleConfig(data.style_json);
        }
      })
      .catch((err) => {
        console.warn('[WidgetCraft] Using verified cached icons:', err.message);
      });

    // 2. Inject embed script for WidgetCraft analytics & embed detection
    if (!document.querySelector('script[src="https://backend.ormconsult.com/embed/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://backend.ormconsult.com/embed/widget.js';
      script.setAttribute('data-widget-id', '11');
      script.setAttribute('data-widget-type', 'social_icons');
      script.setAttribute('data-api-base', 'https://backend.ormconsult.com');
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const alignmentClass =
    align === 'center'
      ? 'justify-center'
      : align === 'end'
      ? 'justify-end'
      : 'justify-start';

  return (
    <div className={`widgetcraft-social-wrapper ${className}`}>
      {/* ─── WidgetCraft Embed Container Marker ─── */}
      <div id="widgetcraft-11" ref={mountRef} className="hidden" aria-hidden="true" />

      {/* ─── Live Dynamic Social Media Icons from WidgetCraft API #11 ─── */}
      <div className={`flex flex-wrap items-center gap-3 ${alignmentClass}`}>
        {icons.map((item) => {
          const platformKey = (item.platform || '').toLowerCase();
          const IconSvg = PLATFORM_ICONS[platformKey] || PLATFORM_ICONS.instagram;
          const brandStyle = PLATFORM_COLORS[platformKey] || 'bg-[#111827] text-white';

          return (
            <a
              key={item.id || platformKey}
              href={item.url}
              target={item.target_blank !== false ? '_blank' : '_self'}
              rel={item.nofollow !== false ? 'noopener noreferrer nofollow' : 'noopener noreferrer'}
              title={item.tooltip || item.platform}
              aria-label={item.tooltip || item.platform}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md hover:scale-110 hover:shadow-lg cursor-pointer ${brandStyle}`}
            >
              {IconSvg}
            </a>
          );
        })}
      </div>
    </div>
  );
}

