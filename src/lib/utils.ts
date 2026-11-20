import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format reminder timestamp cleanly with 12h or 24h support
 */
export function formatReminderDate(dateString: string | null | undefined, is24Hour = false): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const timeFormat = is24Hour ? 'HH:mm' : 'h:mm a';
  const timeStr = format(date, timeFormat);

  if (isToday(date)) {
    return `Today at ${timeStr}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${timeStr}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${timeStr}`;
  }
  return `${format(date, 'MMM d, yyyy')} • ${timeStr}`;
}

/**
 * Format note card timestamp cleanly and compactly
 */
export function formatNoteTimestamp(dateString: string | null | undefined, is24Hour = false): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const timeFormat = is24Hour ? 'HH:mm' : 'h:mm a';
  const timeStr = format(date, timeFormat);

  if (isToday(date)) {
    return `Today, ${timeStr}`;
  }
  if (isYesterday(date)) {
    return `Yesterday, ${timeStr}`;
  }
  return `${format(date, 'MMM d')} • ${timeStr}`;
}

/**
 * Generate a random UUID v4 cleanly without external dependency
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Auto capitalize the very first character of note title
 */
export function autoCapitalize(text: string): string {
  if (!text || text.length === 0) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Strip markdown formatting tokens from text for compact snippet previews in cards
 */
export function cleanFormattedSnippet(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '') // Remove heading markers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/<\/?u>/gi, '') // Remove underline
    .trim();
}

/**
 * Extract all HTTP/HTTPS and www URLs from given text
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const matches = text.match(urlRegex) || [];
  const uniqueUrls: string[] = [];

  for (let url of matches) {
    // Strip trailing punctuation like ., ), ,, ;
    url = url.replace(/[.,);]+$/, '');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    if (!uniqueUrls.includes(url)) {
      uniqueUrls.push(url);
    }
  }

  return uniqueUrls;
}

/**
 * Clean domain name extraction for URL chips
 */
export function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Resize a single image to maximum bound dimension (default 640px)
 */
export async function resizeImageToMaxDimension(file: File, maxDimension = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img.src);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Export as high quality JPEG
      const resizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
      resolve(resizedBase64);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Resize multiple image files concurrently
 */
export async function resizeMultipleImages(files: FileList | File[], maxDimension = 640): Promise<string[]> {
  const fileArray = Array.from(files);
  const tasks = fileArray.map((f) => resizeImageToMaxDimension(f, maxDimension));
  return Promise.all(tasks);
}

/**
 * Convert a base64 data URL or blob URL to a standard File object for Web Share API
 */
export async function urlToFile(url: string, filename: string): Promise<File> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const mime = blob.type || (url.includes('image/jpeg') ? 'image/jpeg' : 'image/png');
    return new File([blob], filename, { type: mime });
  } catch {
    const arr = url.split(',');
    const mimeMatch = arr[0]?.match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : (url.includes('image/jpeg') ? 'image/jpeg' : 'image/png');
    const bstr = atob(arr[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
}

/**
 * Share a note with text and attached images via Web Share API with clipboard fallback
 */
export async function shareNoteWithImages(options: {
  title?: string;
  text: string;
  images?: string[];
}): Promise<{ shared: boolean; method: 'share-files' | 'share-text' | 'clipboard' }> {
  const { title = '', text, images = [] } = options;

  if (typeof navigator !== 'undefined' && navigator.share) {
    // If images exist and browser supports file sharing
    if (images.length > 0 && navigator.canShare) {
      try {
        const files: File[] = [];
        for (let i = 0; i < images.length; i++) {
          const ext = images[i].includes('image/jpeg') ? 'jpg' : 'png';
          const file = await urlToFile(images[i], `note-image-${i + 1}.${ext}`);
          files.push(file);
        }

        if (files.length > 0 && navigator.canShare({ files })) {
          await navigator.share({
            title: title || 'Note',
            text,
            files,
          });
          return { shared: true, method: 'share-files' };
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return { shared: true, method: 'share-files' };
        }
        // Fallback to text-only share if file share threw error
      }
    }

    // Try text-only share
    try {
      await navigator.share({
        title: title || 'Note',
        text,
      });
      return { shared: true, method: 'share-text' };
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return { shared: true, method: 'share-text' };
      }
    }
  }

  // Fallback: clipboard copy
  try {
    await navigator.clipboard.writeText(text);
    return { shared: true, method: 'clipboard' };
  } catch {
    return { shared: false, method: 'clipboard' };
  }
}

/**
 * Share a single image via Web Share API or download fallback
 */
export async function shareSingleImage(
  imageUrl: string,
  title?: string
): Promise<{ shared: boolean; method: 'share-file' | 'download' }> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const ext = imageUrl.includes('image/jpeg') ? 'jpg' : 'png';
      const file = await urlToFile(imageUrl, `note-image-${Date.now()}.${ext}`);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: title || 'Note Image',
          files: [file],
        });
        return { shared: true, method: 'share-file' };
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return { shared: true, method: 'share-file' };
      }
    }
  }

  // Fallback: download the image
  const a = document.createElement('a');
  a.href = imageUrl;
  a.download = `note-image-${Date.now()}.${imageUrl.includes('image/jpeg') ? 'jpg' : 'png'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return { shared: true, method: 'download' };
}
