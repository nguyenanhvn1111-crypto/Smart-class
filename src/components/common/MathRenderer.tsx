import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * MathRenderer parses content containing LaTeX expressions (e.g. $...$ or $$...$$)
 * and renders them using KaTeX while preserving normal rich-text content safely.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
  if (!content) return null;

  // Split content by inline ($...$) or block ($$...$$) math delimiters
  const renderMathAndText = () => {
    // Regex matching $$block$$ or $inline$
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return (
            <span
              key={index}
              className="my-1.5 block text-center overflow-x-auto py-1"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="font-mono text-red-500">{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return (
            <span
              key={index}
              className="inline-block px-0.5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index} className="font-mono text-red-500">{part}</span>;
        }
      } else {
        // Normal text (preserve line breaks)
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      }
    });
  };

  if (inline) {
    return <span className={`math-content ${className}`}>{renderMathAndText()}</span>;
  }

  return <div className={`math-content leading-relaxed ${className}`}>{renderMathAndText()}</div>;
};
