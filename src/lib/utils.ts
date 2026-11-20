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
