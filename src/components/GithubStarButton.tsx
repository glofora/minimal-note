import React from 'react';
import { Star, ExternalLink } from 'lucide-react';
import { useGithubStars } from '@/hooks/useGithubStars';

interface GithubStarButtonProps {
  variant?: 'navbar' | 'drawer' | 'modal';
  className?: string;
}

export const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export const GithubStarButton: React.FC<GithubStarButtonProps> = ({
  variant = 'navbar',
  className = '',
}) => {
  const stars = useGithubStars();

  const formattedStars =
    stars !== null
      ? stars >= 1000
        ? `${(stars / 1000).toFixed(1)}k`
        : stars.toString()
      : null;

  if (variant === 'drawer') {
    return (
      <a
        href="https://github.com/glofora/minimal-note"
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center justify-between p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 transition-all group ${className}`}
        title="Star glofora/minimal-note on GitHub"
      >
        <div className="flex items-center gap-2.5">
          <GithubIcon className="w-4 h-4 text-foreground" />
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground leading-tight">
              glofora/minimal-note
            </span>
            <span className="text-[10px] text-muted-foreground">
              Star repository on GitHub
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-500 text-xs font-bold border border-amber-500/30">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>{formattedStars !== null ? formattedStars : 'Star'}</span>
        </div>
      </a>
    );
  }

  if (variant === 'modal') {
    return (
      <a
        href="https://github.com/glofora/minimal-note"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 text-xs font-bold transition-all group ${className}`}
      >
        <GithubIcon className="w-3.5 h-3.5 text-foreground" />
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
        <span>Star</span>
        {formattedStars !== null && (
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-[11px] font-mono font-semibold">
            {formattedStars}
          </span>
        )}
        <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
      </a>
    );
  }

  // Navbar variant
  return (
    <a
      href="https://github.com/glofora/minimal-note"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-xs font-semibold transition-all group shrink-0 ${className}`}
      title="Star Minimal Note on GitHub"
    >
      <GithubIcon className="w-3.5 h-3.5 text-foreground" />
      <span className="hidden xs:inline text-foreground font-medium">Star</span>
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
      {formattedStars !== null && (
        <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-[10px] font-mono font-bold leading-tight">
          {formattedStars}
        </span>
      )}
    </a>
  );
};
