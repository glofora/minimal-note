import { useState, useEffect } from 'react';

const REPO_API_URL = 'https://api.github.com/repos/glofora/minimal-note';
const CACHE_KEY = 'minimal_note_github_stars';
const CACHE_TIMESTAMP_KEY = 'minimal_note_github_stars_time';
const CACHE_DURATION_MS = 1000 * 60 * 15; // Cache for 15 minutes to avoid rate limits

export function useGithubStars(): number | null {
  const [stars, setStars] = useState<number | null>(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      return cached !== null ? parseInt(cached, 10) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchStars() {
      try {
        const lastFetch = sessionStorage.getItem(CACHE_TIMESTAMP_KEY);
        const cached = sessionStorage.getItem(CACHE_KEY);

        if (lastFetch && cached !== null) {
          const elapsed = Date.now() - parseInt(lastFetch, 10);
          if (elapsed < CACHE_DURATION_MS) {
            setStars(parseInt(cached, 10));
            return;
          }
        }

        const res = await fetch(REPO_API_URL, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (!res.ok) {
          // If repo is newly created or rate limited, keep existing or fallback
          return;
        }

        const data = await res.json();
        if (typeof data.stargazers_count === 'number' && isMounted) {
          setStars(data.stargazers_count);
          try {
            sessionStorage.setItem(CACHE_KEY, data.stargazers_count.toString());
            sessionStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          } catch {
            // Ignore storage write issues
          }
        }
      } catch {
        // Offline or network error: silent fallback
      }
    }

    fetchStars();

    return () => {
      isMounted = false;
    };
  }, []);

  return stars;
}
