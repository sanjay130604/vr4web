/* External authority links.
   Key = sub-service slug (checked first) or category slug (fallback).
   Keep each page to about 4-6 links, all to authoritative sources. */
export const EXTERNAL_LINKS = {
    // ── App Development ──
    'app-development': [
        { label: 'Android Developers Docs', url: 'https://developer.android.com/docs' },
        { label: 'Apple Developer Documentation', url: 'https://developer.apple.com/documentation/' },
        { label: 'OWASP MASVS (Mobile Security)', url: 'https://mas.owasp.org/MASVS/' },
    ],
    'android-development': [
        { label: 'Android Developers Docs', url: 'https://developer.android.com/docs' },
        { label: 'Kotlin Language Docs', url: 'https://kotlinlang.org/docs/home.html' },
        { label: 'Jetpack Compose Guide', url: 'https://developer.android.com/compose' },
        { label: 'Google Play Policy Center', url: 'https://play.google.com/about/developer-content-policy/' },
    ],
    'ios-development': [
        { label: 'Apple Developer Documentation', url: 'https://developer.apple.com/documentation/' },
        { label: 'SwiftUI Tutorials', url: 'https://developer.apple.com/tutorials/swiftui' },
        { label: 'Human Interface Guidelines', url: 'https://developer.apple.com/design/human-interface-guidelines/' },
        { label: 'App Store Review Guidelines', url: 'https://developer.apple.com/app-store/review/guidelines/' },
    ],
    'react-native-development': [
        { label: 'React Native Docs', url: 'https://reactnative.dev/docs/getting-started' },
        { label: 'Expo Documentation', url: 'https://docs.expo.dev/' },
    ],
    'flutter-development': [
        { label: 'Flutter Docs', url: 'https://docs.flutter.dev/' },
        { label: 'Dart Language', url: 'https://dart.dev/guides' },
    ],

    // ── Software ──
    'software-application-development': [
        { label: 'AWS Well-Architected Framework', url: 'https://aws.amazon.com/architecture/well-architected/' },
        { label: 'Kubernetes Docs', url: 'https://kubernetes.io/docs/home/' },
        { label: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
    ],

    // ── Web ──
    'web-design-and-development': [
        { label: 'web.dev Core Web Vitals', url: 'https://web.dev/articles/vitals' },
        { label: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
        { label: 'WCAG Accessibility Guidelines', url: 'https://www.w3.org/WAI/standards-guidelines/wcag/' },
    ],
    'react-js-development': [
        { label: 'React Documentation', url: 'https://react.dev/' },
    ],
    'next-js-development': [
        { label: 'Next.js Documentation', url: 'https://nextjs.org/docs' },
    ],
    'node-js-development': [
        { label: 'Node.js Docs', url: 'https://nodejs.org/en/docs' },
    ],
    'laravel-development': [
        { label: 'Laravel Documentation', url: 'https://laravel.com/docs' },
    ],

    // ── E-commerce ──
    'e-commerce-solutions': [
        { label: 'Shopify Developer Docs', url: 'https://shopify.dev/docs' },
        { label: 'WooCommerce Documentation', url: 'https://woocommerce.com/documentation/' },
        { label: 'BigCommerce Dev Center', url: 'https://developer.bigcommerce.com/' },
    ],

    // ── Digital marketing ──
    'digital-marketing-solutions': [
        { label: 'Google Search Central', url: 'https://developers.google.com/search/docs' },
        { label: 'Google Ads Help', url: 'https://support.google.com/google-ads' },
        { label: 'Google Analytics 4 Help', url: 'https://support.google.com/analytics' },
    ],

    // ── Creative ──
    'creative-solutions': [
        { label: 'Figma Learn', url: 'https://help.figma.com/' },
        { label: 'Nielsen Norman Group (UX Research)', url: 'https://www.nngroup.com/articles/' },
        { label: 'WCAG Accessibility Guidelines', url: 'https://www.w3.org/WAI/standards-guidelines/wcag/' },
    ],

    // ── Back office ──
    'back-office-support': [
        { label: 'Cloudflare Learning Center', url: 'https://www.cloudflare.com/learning/' },
        { label: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
        { label: 'Google Site Reliability Engineering', url: 'https://sre.google/books/' },
    ],
};

export const getExternalLinks = (subSlug, catSlug) =>
    EXTERNAL_LINKS[subSlug] || EXTERNAL_LINKS[catSlug] || [];

