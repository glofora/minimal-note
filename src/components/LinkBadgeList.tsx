import React from 'react';
import { ExternalLink, Globe, Copy, Check } from 'lucide-react';
import { getDomain } from '@/lib/utils';

interface LinkBadgeListProps {
  links: string[];
  interactive?: boolean;
}

export const LinkBadgeList: React.FC<LinkBadgeListProps> = ({
  links,
  interactive = true,
}) => {
  const [copiedLink, setCopiedLink] = React.useState<string | null>(null);

  if (!links || links.length === 0) return null;

  const handleCopy = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 1500);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      {links.map((url, idx) => {
        const domain = getDomain(url);
        return (
          <div
            key={idx}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs bg-muted/80 hover:bg-muted text-foreground border border-border/80 transition-all shadow-2xs group"
          >
            <Globe className="w-3 h-3 text-primary shrink-0" />
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:underline font-medium truncate max-w-[170px] sm:max-w-[220px]"
              title={url}
            >
              {domain}
            </a>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-3 h-3" />
            </a>

            {interactive && (
              <button
                type="button"
                onClick={(e) => handleCopy(e, url)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                title="Copy link"
              >
                {copiedLink === url ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
