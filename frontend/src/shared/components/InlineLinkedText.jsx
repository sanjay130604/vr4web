import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

/**
 * Renders inline text with rich internal and external links.
 * Supports Markdown syntax: [anchor text](url)
 * 
 * - Internal URLs (e.g. /services/app-development, /contact) render with React Router <Link>
 * - External URLs (e.g. https://developer.android.com/docs) render with <a target="_blank" rel="noopener noreferrer">
 *   and a subtle external link indicator.
 * - Matches the exact typography and styling shown in AboutUs.jsx:
 *   light: text-[#0F3D2E] underline underline-offset-4 hover:text-[#E8890C]
 *   dark:  text-[#FFA726] underline underline-offset-4 hover:text-white
 */
export const InlineLinkedText = ({ text, tone = 'light', showExternalIcon = true, className = '' }) => {
    if (!text || typeof text !== 'string') return text || null;

    // Regex to capture [anchor text](url)
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    const toneClasses = tone === 'dark'
        ? 'font-semibold underline underline-offset-4 text-[#FFA726] decoration-[#FFA726]/70 hover:text-white hover:decoration-white transition-colors duration-200'
        : 'font-semibold underline underline-offset-4 text-[#0F3D2E] decoration-[#0F3D2E]/60 hover:text-[#E8890C] hover:decoration-[#E8890C] transition-colors duration-200';

    while ((match = regex.exec(text)) !== null) {
        // Push text preceding the match
        if (match.index > lastIndex) {
            elements.push(text.slice(lastIndex, match.index));
        }

        const anchorText = match[1];
        const url = match[2].trim();
        const isExternal = /^https?:\/\//i.test(url);

        if (isExternal) {
            elements.push(
                <a
                    key={`ext-${url}-${match.index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-baseline gap-0.5 cursor-pointer ${toneClasses}`}
                >
                    <span>{anchorText}</span>
                    {showExternalIcon && (
                        <ExternalLink className="w-3 h-3 inline self-center opacity-70 ml-0.5 shrink-0" aria-hidden="true" />
                    )}
                </a>
            );
        } else {
            elements.push(
                <Link
                    key={`int-${url}-${match.index}`}
                    to={url}
                    className={`cursor-pointer ${toneClasses}`}
                >
                    {anchorText}
                </Link>
            );
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        elements.push(text.slice(lastIndex));
    }

    return <span className={className}>{elements}</span>;
};

export default InlineLinkedText;

