import React from 'react';

/**
 * Safely parses inline markdown tokens:
 * - **bold**
 * - *italic*
 * - <u>underline</u>
 */
function renderInlineTokens(text: string): React.ReactNode[] {
  if (!text) return [];

  // Match **bold**, *italic*, and <u>underline</u>
  const regex = /(\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>)/gi;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }

    const lower = part.toLowerCase();
    if (lower.startsWith('<u>') && lower.endsWith('</u>') && part.length >= 7) {
      return (
        <span key={i} className="underline underline-offset-3 decoration-primary/70">
          {part.slice(3, -4)}
        </span>
      );
    }

    return part;
  });
}

interface FormattedTextProps {
  content: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed break-words text-foreground ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
          return (
            <h1
              key={idx}
              className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight pt-2 pb-1 border-b border-border/40"
            >
              {renderInlineTokens(trimmed.slice(2))}
            </h1>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className="text-lg sm:text-xl font-bold text-foreground tracking-tight pt-1.5 pb-0.5 border-b border-border/30"
            >
              {renderInlineTokens(trimmed.slice(3))}
            </h2>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base sm:text-lg font-semibold text-foreground pt-1">
              {renderInlineTokens(trimmed.slice(4))}
            </h3>
          );
        }

        if (trimmed === '') {
          return <div key={idx} className="h-2" />;
        }

        return (
          <p key={idx} className="text-sm sm:text-base text-foreground/90">
            {renderInlineTokens(line)}
          </p>
        );
      })}
    </div>
  );
};
