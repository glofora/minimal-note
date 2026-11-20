import React, { useState, useEffect, useRef } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { NOTE_COLORS, type NoteColor, type ChecklistItem, type NoteType } from '@/types/note';
import {
  autoCapitalize,
  resizeMultipleImages,
  extractUrls,
  formatReminderDate,
  generateUUID,
} from '@/lib/utils';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  ScanText,
  Bell,
  Trash2,
  Share2,
  Copy,
  Check,
  Calendar,
  Clock,
  Loader2,
  CheckSquare,
  AlignLeft,
  Pin,
  MoreVertical,
  X,
  Palette,
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { addHours, format, isBefore, setHours, setMinutes } from 'date-fns';
import { getTranslation } from '@/lib/i18n';
import { ChecklistEditor } from './ChecklistEditor';
import { LinkBadgeList } from './LinkBadgeList';
import { RichTextEditor } from './RichTextEditor';
import { formatDescriptionToHtml, htmlToPlainText } from '@/lib/sanitize';

export const NoteEditorModal: React.FC = () => {
  const {
    activeEditingNote,
    isEditorOpen,
    closeEditorModal,
    saveActiveNote,
    requestDeleteNote,
    updateChecklistOrder,
    openImageGallery,
    preferences,
  } = useNotesStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<NoteColor>('indigo');
  const [noteType, setNoteType] = useState<NoteType>('text');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const t = getTranslation(preferences.language);

  // Close three-dot menu on click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Sync state when active note changes
  useEffect(() => {
    if (activeEditingNote) {
      setTitle(activeEditingNote.title || '');
      setDescription(formatDescriptionToHtml(activeEditingNote.description || ''));
      setColor(activeEditingNote.color || preferences.defaultColor);
      setNoteType(activeEditingNote.noteType || 'text');
      setChecklist(activeEditingNote.checklist || []);
      setIsPinned(Boolean(activeEditingNote.isPinned));

      const existingImages =
        activeEditingNote.images && activeEditingNote.images.length > 0
          ? activeEditingNote.images
          : activeEditingNote.imageDataUrl
          ? [activeEditingNote.imageDataUrl]
          : [];
      setImages(existingImages);

      setHasReminder(activeEditingNote.hasReminder || false);

      if (activeEditingNote.reminderAt) {
        const d = new Date(activeEditingNote.reminderAt);
        setReminderDate(format(d, 'yyyy-MM-dd'));
        setReminderTime(format(d, 'HH:mm'));
      } else {
        const defaultDate = addHours(new Date(), 1);
        setReminderDate(format(defaultDate, 'yyyy-MM-dd'));
        setReminderTime(format(defaultDate, 'HH:mm'));
      }
    }
  }, [activeEditingNote, preferences.defaultColor]);

  if (!isEditorOpen || !activeEditingNote) return null;

  // Real-time URL extraction
  const allText = `${title}\n${description}\n${checklist.map((c) => c.text).join('\n')}`;
  const extractedLinks = extractUrls(allText);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(autoCapitalize(e.target.value));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const resizedArray = await resizeMultipleImages(files, 640);
      setImages((prev) => [...prev, ...resizedArray]);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTriggerOCR = async (imageIndex = 0) => {
    if (images.length === 0 || isOcrProcessing) return;
    const targetImage = images[imageIndex] || images[0];

    setIsOcrProcessing(true);
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(targetImage);
      await worker.terminate();

      const extractedText = ret.data.text.trim();
      if (extractedText) {
        if (noteType === 'checklist') {
          const lines = extractedText
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          const newItems: ChecklistItem[] = lines.map((text) => ({
            id: generateUUID(),
            text,
            isCompleted: false,
          }));
          setChecklist((prev) => [...prev, ...newItems]);
        } else {
          setDescription((prev) =>
            prev ? `${prev}<br/><br/>${extractedText}` : formatDescriptionToHtml(extractedText)
          );
        }
      }
    } catch (err) {
      console.error('OCR processing error:', err);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const toggleCheckboxesMode = () => {
    if (noteType === 'text') {
      const plain = htmlToPlainText(description);
      const lines = plain
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const newItems: ChecklistItem[] =
        lines.length > 0
          ? lines.map((text) => ({
              id: generateUUID(),
              text,
              isCompleted: false,
            }))
          : [{ id: generateUUID(), text: '', isCompleted: false }];

      setChecklist(newItems);
      setNoteType('checklist');
    } else {
      const html = checklist
        .map((i) => i.text.trim())
        .filter((t) => t.length > 0)
        .map((t) => `<p>${t}</p>`)
        .join('');
      setDescription(html);
      setNoteType('text');
    }
  };

  const handleChecklistChange = (items: ChecklistItem[]) => {
    setChecklist(items);
    if (activeEditingNote?.id) {
      updateChecklistOrder(activeEditingNote.id, items);
    }
  };

  const handleSaveAndClose = async () => {
    let combinedReminderAt: string | null = null;
    if (hasReminder && reminderDate && reminderTime) {
      const [year, month, day] = reminderDate.split('-').map(Number);
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const dt = new Date(year, month - 1, day, hours, minutes);
      combinedReminderAt = dt.toISOString();
    }

    await saveActiveNote({
      title: title.trim(),
      description: description.trim(),
      color,
      noteType,
      checklist,
      images,
      imageDataUrl: images[0] || null,
      links: extractedLinks,
      hasReminder,
      reminderAt: combinedReminderAt,
      isPinned,
    });
  };

  const handleShare = async () => {
    setIsMenuOpen(false);
    const listSummary =
      noteType === 'checklist'
        ? checklist.map((i) => `${i.isCompleted ? '✓' : '○'} ${i.text}`).join('\n')
        : htmlToPlainText(description);

    const shareText = `${title}\n\n${listSummary}\n\n— Minimal Note`;
    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'Note', text: shareText });
      } catch {
        // user canceled
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleCopy = () => {
    setIsMenuOpen(false);
    const listSummary =
      noteType === 'checklist'
        ? checklist.map((i) => `${i.isCompleted ? '✓' : '○'} ${i.text}`).join('\n')
        : htmlToPlainText(description);
    const text = `${title}\n\n${listSummary}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (activeEditingNote.id) {
      requestDeleteNote(activeEditingNote.id, title || activeEditingNote.title);
    }
  };

  const setPresetReminder = (hoursFromNow: number) => {
    const target = addHours(new Date(), hoursFromNow);
    setReminderDate(format(target, 'yyyy-MM-dd'));
    setReminderTime(format(target, 'HH:mm'));
    setHasReminder(true);
  };

  const setTomorrowMorning = () => {
    const tomorrow = setMinutes(setHours(addHours(new Date(), 24), 9), 0);
    setReminderDate(format(tomorrow, 'yyyy-MM-dd'));
    setReminderTime(format(tomorrow, 'HH:mm'));
    setHasReminder(true);
  };

  const colorConfig = NOTE_COLORS[color] || NOTE_COLORS.default;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 sm:p-4 bg-background sm:bg-black/60 sm:backdrop-blur-xs animate-in fade-in duration-200">
      {/* Hidden file & camera inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div
        className={`relative w-full h-full sm:max-w-xl sm:h-auto sm:max-h-[92vh] flex flex-col ${colorConfig.bgLight} ${colorConfig.bgDark} sm:border ${colorConfig.borderLight} ${colorConfig.borderDark} sm:rounded-3xl shadow-2xl overflow-hidden transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Google Keep Style Navigation & Actions */}
        <div className="relative z-[500] flex items-center justify-between px-3.5 sm:px-5 py-3 border-b border-border/80 bg-card/95 backdrop-blur-md shrink-0">
          {/* Top-Left: Back Arrow Navigation & Current Color Pill */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="p-2 -ml-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
              title="Save and back"
              aria-label="Back to notes list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5">
              {color !== 'default' && (
                <span className={`w-2.5 h-2.5 rounded-full ${colorConfig.dotClass}`} />
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                {colorConfig.label}
              </span>
            </div>
          </div>

          {/* Top-Right: Pin, Mode Toggle, Three-Dot Menu (⋮) & Save */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Quick Pin Toggle */}
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-xl transition-colors ${
                isPinned
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={isPinned ? 'Unpin note' : 'Pin note'}
              aria-label={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className={`w-4 h-4 ${isPinned ? 'fill-primary text-primary -rotate-12' : ''}`} />
            </button>

            {/* Toggle Checkboxes (Google Keep style) */}
            <button
              type="button"
              onClick={toggleCheckboxesMode}
              className={`p-2 rounded-xl transition-colors ${
                noteType === 'checklist'
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={noteType === 'checklist' ? 'Switch to text note' : 'Switch to checkboxes'}
            >
              {noteType === 'checklist' ? (
                <AlignLeft className="w-4 h-4" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
            </button>

            {/* Consolidate Three-Dot Menu (⋮) with Opaque Solid Dark Background */}
            <div ref={menuRef} className="relative z-[510]">
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="More options"
                aria-label="More options"
                aria-expanded={isMenuOpen}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Solid Opaque Dropdown Menu (z-[999]) */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[990] bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-1.5 w-48 sm:w-52 py-1.5 bg-[#181824] dark:bg-[#181824] text-white border border-white/10 rounded-2xl shadow-2xl z-[999] animate-in fade-in zoom-in-95 duration-150 space-y-0.5"
                    role="menu"
                  >
                    <div className="px-3 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                        Note Options
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsMenuOpen(false)}
                        className="p-0.5 rounded text-white/60 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Pin / Unpin */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsPinned(!isPinned);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors text-left cursor-pointer"
                      role="menuitem"
                    >
                      <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-primary text-primary -rotate-12' : 'text-white/60'}`} />
                      <span>{isPinned ? 'Unpin Note' : 'Pin Note'}</span>
                    </button>

                    {/* Attach Image (Gallery) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors text-left cursor-pointer"
                      role="menuitem"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                      <span>Attach Image</span>
                    </button>

                    {/* Take Photo (Camera) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        cameraInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors text-left cursor-pointer"
                      role="menuitem"
                    >
                      <Camera className="w-3.5 h-3.5 text-primary" />
                      <span>Take Photo</span>
                    </button>

                    {/* OCR Extraction */}
                    {images.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleTriggerOCR(0);
                        }}
                        disabled={isOcrProcessing}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors text-left cursor-pointer"
                        role="menuitem"
                      >
                        <ScanText className="w-3.5 h-3.5 text-primary" />
                        <span>{isOcrProcessing ? 'Extracting OCR...' : 'Grab Text (OCR)'}</span>
                      </button>
                    )}

                    {/* Copy */}
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors text-left cursor-pointer"
                      role="menuitem"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/60" />
                      )}
                      <span>{copied ? 'Copied to clipboard' : 'Copy Text'}</span>
                    </button>

                    {/* Share */}
                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 rounded-lg transition-colors text-left cursor-pointer"
                      role="menuitem"
                    >
                      <Share2 className="w-3.5 h-3.5 text-white/60" />
                      <span>Share Note</span>
                    </button>

                    <div className="my-1 border-t border-white/10" />

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors text-left cursor-pointer"
                      role="menuitem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Note</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="ml-1 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>

        {/* Scrollable Maximize Writing Area */}
        <div className="relative z-0 flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-4">
          {/* Note Title */}
          <div>
            <input
              type="text"
              placeholder={t.titlePlaceholder}
              value={title}
              onChange={handleTitleChange}
              autoFocus
              className="w-full text-xl sm:text-2xl font-bold bg-transparent border-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/40 text-foreground"
            />
          </div>

          {/* Inline Action Pills Strip: Image, Camera, OCR, Color Tag & Remind Me */}
          <div className="flex items-center gap-1.5 py-0.5 overflow-x-auto no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground transition-colors shrink-0 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-primary" />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground transition-colors shrink-0 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-primary" />
              <span>Camera</span>
            </button>

            {images.length > 0 && (
              <button
                type="button"
                onClick={() => handleTriggerOCR(0)}
                disabled={isOcrProcessing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent text-accent-foreground transition-colors shrink-0 cursor-pointer"
              >
                {isOcrProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ScanText className="w-3.5 h-3.5 text-primary" />
                )}
                <span>OCR</span>
              </button>
            )}

            {/* Compact Color Tag Action Pill */}
            <button
              type="button"
              onClick={() => setIsColorModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground transition-colors shrink-0 border border-border/40 cursor-pointer shadow-2xs"
              title="Open Color & Tag settings"
            >
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span className={`w-2 h-2 rounded-full ${colorConfig.dotClass}`} />
              <span className="font-medium">{colorConfig.label}</span>
            </button>

            {/* Compact Reminder Action Pill */}
            <button
              type="button"
              onClick={() => setIsReminderModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors shrink-0 border cursor-pointer shadow-2xs ${
                hasReminder
                  ? 'bg-primary/15 text-primary border-primary/30 font-semibold'
                  : 'bg-muted/60 hover:bg-muted text-foreground border-border/40'
              }`}
              title="Open Reminder settings"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>
                {hasReminder && reminderDate
                  ? formatReminderDate(`${reminderDate}T${reminderTime || '09:00'}`, preferences.is24HourFormat)
                  : 'Reminder'}
              </span>
            </button>
          </div>

          {/* Multiple Attached Images: Compact Horizontal Collage Preview Strip */}
          {images.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Attached Images ({images.length})</span>
                <span className="text-[11px] font-normal lowercase text-muted-foreground/70">
                  Tap image for full-screen gallery
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {images.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-border bg-black/5 dark:bg-black/30 h-24 sm:h-28 w-28 sm:w-32 shrink-0 shadow-2xs"
                  >
                    <img
                      src={imgSrc}
                      alt={`Attached ${idx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openImageGallery(images, idx);
                      }}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-95 active:scale-95 transition-all"
                      title="Click to view full-screen gallery"
                    />

                    {/* Remove Image Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-all shadow-md cursor-pointer opacity-80 hover:opacity-100"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <span className="absolute bottom-1 left-1.5 px-1.5 py-0.2 rounded-md bg-black/60 text-white text-[10px] font-mono">
                      {idx + 1}/{images.length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected Web Links */}
          {extractedLinks.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Detected Links
              </span>
              <LinkBadgeList links={extractedLinks} />
            </div>
          )}

          {/* Note Writing Area: Checklist mode OR Plain Text mode (Maximized Space) */}
          {noteType === 'checklist' ? (
            <div className="pb-6">
              <ChecklistEditor items={checklist} onChange={handleChecklistChange} />
            </div>
          ) : (
            <div className="pb-6">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder={t.notePlaceholder}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dedicated Color & Tag Modal for Note Details (z-[3500]) */}
      {isColorModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[3500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
          onClick={() => setIsColorModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm p-5 sm:p-6 bg-card border border-border rounded-3xl shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Color & Tag</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {title || 'Untitled Note'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsColorModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 9 Color Swatches */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Select Color Tag
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(NOTE_COLORS) as NoteColor[]).map((cKey) => {
                  const conf = NOTE_COLORS[cKey];
                  const isSelected = color === cKey;
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => {
                        setColor(cKey);
                        setIsColorModalOpen(false);
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-muted/70 font-semibold'
                          : 'border-border/70 hover:bg-muted/40'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full ${conf.dotClass} flex items-center justify-center shrink-0 shadow-xs`}>
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </span>
                      <span className="text-xs text-foreground truncate">{conf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsColorModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Reminder Settings Modal for Note Details (z-[3500]) */}
      {isReminderModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[3500] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none"
          onClick={() => setIsReminderModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm p-5 sm:p-6 bg-card border border-border rounded-3xl shadow-2xl animate-in zoom-in-95 duration-150 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Set Reminder</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {title || 'Untitled Note'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Quick Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPresetReminder(1);
                    setIsReminderModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors font-medium cursor-pointer"
                >
                  In 1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPresetReminder(3);
                    setIsReminderModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors font-medium cursor-pointer"
                >
                  In 3 Hours
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTomorrowMorning();
                    setIsReminderModalOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors font-medium cursor-pointer"
                >
                  Tomorrow 9 AM
                </button>
              </div>
            </div>

            {/* Custom Date & Time Inputs */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Custom Date & Time
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => {
                      setReminderDate(e.target.value);
                      setHasReminder(true);
                    }}
                    className="w-full pl-9 pr-2 py-1.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => {
                      setReminderTime(e.target.value);
                      setHasReminder(true);
                    }}
                    className="w-full pl-9 pr-2 py-1.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Actions: Clear & Done */}
            <div className="flex items-center justify-between pt-2">
              {hasReminder ? (
                <button
                  type="button"
                  onClick={() => {
                    setHasReminder(false);
                    setIsReminderModalOpen(false);
                  }}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear Reminder
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
