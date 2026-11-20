import React, { useEffect, useState, useRef } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { X, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { shareSingleImage } from '@/lib/utils';

export const ImageLightboxModal: React.FC = () => {
  const {
    previewImage,
    previewGallery,
    closeImageGallery,
    nextGalleryImage,
    prevGalleryImage,
  } = useNotesStore();

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Normalize images and active index
  const galleryImages = previewGallery ? previewGallery.images : previewImage ? [previewImage] : [];
  const activeIndex = previewGallery ? previewGallery.activeIndex : 0;
  const currentImage = galleryImages[activeIndex] || previewImage;
  const totalCount = galleryImages.length;
  const hasMultiple = totalCount > 1;

  useEffect(() => {
    if (!currentImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeImageGallery();
      } else if (e.key === 'ArrowRight' && hasMultiple) {
        nextGalleryImage();
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        prevGalleryImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImage, hasMultiple, closeImageGallery, nextGalleryImage, prevGalleryImage]);

  if (!currentImage) return null;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentImage) return;
    await shareSingleImage(currentImage, `Note Image ${activeIndex + 1}`);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = currentImage;
    a.download = `note-image-${Date.now()}.${currentImage.includes('image/jpeg') ? 'jpg' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !hasMultiple) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextGalleryImage();
    } else if (isRightSwipe) {
      prevGalleryImage();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery"
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-6 select-none animate-in fade-in duration-200"
      onClick={closeImageGallery}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Header: Image Counter & Action Controls */}
      <div
        className="fixed top-4 inset-x-4 sm:inset-x-8 z-[5010] flex items-center justify-between pointer-events-none"
      >
        {/* Counter Badge */}
        {hasMultiple ? (
          <div className="px-3 py-1.5 rounded-full bg-white/10 text-white/90 font-medium text-xs backdrop-blur-md border border-white/10 shadow-lg pointer-events-auto">
            {activeIndex + 1} / {totalCount}
          </div>
        ) : (
          <div />
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleShare}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg border border-white/10"
            title="Share image"
            aria-label="Share image"
          >
            <Share2 className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg border border-white/10"
            title="Download image"
            aria-label="Download image"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={closeImageGallery}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-lg border border-white/10"
            title="Close gallery"
            aria-label="Close gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Previous Button (<) */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            prevGalleryImage();
          }}
          className="fixed left-3 sm:left-6 z-[5010] p-3 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white backdrop-blur-md transition-all cursor-pointer shadow-2xl border border-white/10 flex items-center justify-center"
          title="Previous image (Left Arrow)"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}

      {/* Main High-Resolution Image */}
      <div
        className="relative max-w-5xl max-h-[85vh] sm:max-h-[88vh] flex items-center justify-center p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          key={currentImage}
          src={currentImage}
          alt={`Gallery image ${activeIndex + 1} of ${totalCount}`}
          className="max-w-full max-h-[82vh] sm:max-h-[86vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-150 border border-white/10"
        />
      </div>

      {/* Next Button (>) */}
      {hasMultiple && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            nextGalleryImage();
          }}
          className="fixed right-3 sm:right-6 z-[5010] p-3 rounded-full bg-white/10 hover:bg-white/25 active:scale-90 text-white backdrop-blur-md transition-all cursor-pointer shadow-2xl border border-white/10 flex items-center justify-center"
          title="Next image (Right Arrow)"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
};
