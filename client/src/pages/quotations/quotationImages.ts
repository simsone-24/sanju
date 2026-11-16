import { useEffect, useRef } from 'react';

// Sample decor images on a quotation. Each carries a short description ("Stage", "Hall"…) that is
// printed under it in the quotation PDF and its previews.

/** The server's cap on images per quotation. */
export const MAX_QUOTATION_IMAGES = 12;

/** Longest description the server accepts. */
export const QUOTATION_IMAGE_CAPTION_MAX = 100;

/** An image chosen but not yet uploaded — held until the quotation it belongs to exists. */
export interface StagedQuotationImage {
  file: File;
  caption: string;
}

/** One picture as the quotation preview draws it. */
export interface QuotationPreviewImage {
  src: string;
  caption: string | null;
}

/** Adds newly chosen files (with no description yet), stopping at the per-quotation cap. */
export function stageQuotationImages(current: StagedQuotationImage[], files: File[]): StagedQuotationImage[] {
  return [...current, ...files.map((file) => ({ file, caption: '' }))].slice(0, MAX_QUOTATION_IMAGES);
}

export function setStagedCaption(
  images: StagedQuotationImage[],
  index: number,
  caption: string,
): StagedQuotationImage[] {
  return images.map((image, position) => (position === index ? { ...image, caption } : image));
}

/**
 * Preview URLs for staged images, one per file, in order.
 *
 * Each file keeps the same URL for as long as it stays staged. That matters because the thumbnails
 * are keyed by URL: if typing a description produced fresh URLs (as rebuilding them on every change
 * does), every keystroke would remount the thumbnail and its description field would lose focus. A
 * URL is released when its file is removed, and all of them when the component unmounts.
 */
export function useStagedImageUrls(images: StagedQuotationImage[]): string[] {
  const cache = useRef(new Map<File, string>());

  const urls = images.map(({ file }) => {
    let url = cache.current.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      cache.current.set(file, url);
    }
    return url;
  });

  useEffect(() => {
    const staged = new Set(images.map(({ file }) => file));
    for (const [file, url] of cache.current) {
      if (!staged.has(file)) {
        URL.revokeObjectURL(url);
        cache.current.delete(file);
      }
    }
  });

  useEffect(() => {
    const held = cache.current;
    return () => {
      held.forEach((url) => URL.revokeObjectURL(url));
      held.clear();
    };
  }, []);

  return urls;
}
