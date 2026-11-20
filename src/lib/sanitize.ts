/**
 * Utility functions for Rich Text handling, sanitization, and backward compatibility
 */

/**
 * Checks whether a string contains HTML markup
 */
export function isHtml(str: string): boolean {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}

/**
 * Ensures a note description string is in valid HTML format.
 * If given plain text (from legacy notes), converts newlines to HTML paragraphs/breaks.
 */
export function formatDescriptionToHtml(description: string): string {
  if (!description) return '';
  if (isHtml(description)) {
    return description;
  }
  // Convert double newlines to paragraphs, single newlines to <br/>
  const paragraphs = description.split(/\n\s*\n/);
  return paragraphs
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

/**
 * Converts rich HTML content to clean, human-readable plain text
 * (Used for clipboard copy, OS share sheet, and search indexing)
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  if (!isHtml(html)) return html;

  // In browser environment, use DOM parser
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return (temp.innerText || temp.textContent || '').trim();
  }

  // Fallback regex for non-DOM environments
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Sanitizes HTML to allow only safe formatting tags.
 * Strips script tags, iframes, inline event handlers (onerror, onload, etc.), and dangerous schemes.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  // Disallow scripts, objects, embeds, iframes, and meta/link tags
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '');

  // Strip all on* event handler attributes like onclick=, onerror=, etc.
  cleaned = cleaned.replace(/\son\w+\s*=\s*(["']).*?\1/gi, '');
  cleaned = cleaned.replace(/\son\w+\s*=\s*[^\s>]+/gi, '');

  // Strip javascript: pseudo-protocol in href or src
  cleaned = cleaned.replace(/href\s*=\s*(["'])\s*javascript:[^"']*\1/gi, 'href="#"');
  cleaned = cleaned.replace(/src\s*=\s*(["'])\s*javascript:[^"']*\1/gi, 'src=""');

  return cleaned;
}
