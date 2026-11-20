import React, { useState, useEffect, useRef } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { NOTE_COLORS, type NoteColor, type ChecklistItem, type NoteType } from '@/types/note';
import {
  autoCapitalize,
  resizeMultipleImages,
  extractUrls,
  generateUUID,
} from '@/lib/utils';
import {
  X,
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
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { addHours, format, isBefore, setHours, setMinutes } from 'date-fns';
import { getTranslation } from '@/lib/i18n';
import { ChecklistEditor } from './ChecklistEditor';
import { LinkBadgeList } from './LinkBadgeList';

export const NoteEditorModal: React.FC = () => {
  const {
    activeEditingNote,
    isEditorOpen,
    closeEditorModal,
    saveActiveNote,
    deleteNote,
    preferences,
  } = useNotesStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<NoteColor>('indigo');
  const [noteType, setNoteType] = useState<NoteType>('text');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeOcrImageIndex, setActiveOcrImageIndex] = useState<number | null>(null);
  const t = getTranslation(preferences.language);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when active note changes
  useEffect(() => {
    if (activeEditingNote) {
      setTitle(activeEditingNote.title || '');
      setDescription(activeEditingNote.description || '');
      setColor(activeEditingNote.color || preferences.defaultColor);
      setNoteType(activeEditingNote.noteType || 'text');
      setChecklist(activeEditingNote.checklist || []);

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

  // Auto-resize description textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
    }
  }, [description]);

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
    setActiveOcrImageIndex(imageIndex);

    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(targetImage);
      const extractedText = ret.data.text.trim();
      await worker.terminate();

      if (extractedText) {
        if (noteType === 'checklist') {
          // Add as checklist items split by lines
          const lines = extractedText
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
          const newItems: ChecklistItem[] = lines.map((l) => ({
            id: generateUUID(),
            text: l,
            isCompleted: false,
          }));
          setChecklist((prev) => [...prev, ...newItems]);
        } else {
          setDescription((prev) =>
            prev.trim() ? `${prev.trim()}\n\n[OCR Text]:\n${extractedText}` : extractedText
          );
        }
      }
    } catch (err) {
      console.error('OCR Extraction error:', err);
    } finally {
      setIsOcrProcessing(false);
      setActiveOcrImageIndex(null);
    }
  };

  // Switch between Plain Text and Checkboxes (like Google Keep)
  const toggleCheckboxesMode = () => {
    if (noteType === 'text') {
      // Convert text lines to checklist
      const lines = description
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const items: ChecklistItem[] =
        lines.length > 0
          ? lines.map((text) => ({ id: generateUUID(), text, isCompleted: false }))
          : [{ id: generateUUID(), text: '', isCompleted: false }];

      setChecklist(items);
      setNoteType('checklist');
    } else {
      // Convert checklist items to text
      const joined = checklist
        .map((item) => (item.isCompleted ? `[x] ${item.text}` : item.text))
        .join('\n');
      setDescription(joined);
      setNoteType('text');
    }
  };

  const handleSaveAndClose = async () => {
    let combinedReminderAt: string | null = null;

    if (hasReminder && reminderDate && reminderTime) {
      try {
        const [year, month, day] = reminderDate.split('-').map(Number);
        const [hours, minutes] = reminderTime.split(':').map(Number);
        const d = new Date(year, month - 1, day, hours, minutes);
        combinedReminderAt = d.toISOString();
      } catch (e) {
        console.warn('Invalid reminder date parse', e);
      }
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
    });
  };

  const handleShare = async () => {
    const listSummary =
      noteType === 'checklist'
        ? checklist.map((i) => `${i.isCompleted ? '✓' : '○'} ${i.text}`).join('\n')
        : description;

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
    const listSummary =
      noteType === 'checklist'
        ? checklist.map((i) => `${i.isCompleted ? '✓' : '○'} ${i.text}`).join('\n')
        : description;
    const text = `${title}\n\n${listSummary}`.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async () => {
    if (activeEditingNote.id) {
      await deleteNote(activeEditingNote.id);
      closeEditorModal();
    }
  };

  const isReminderInPast = () => {
    if (!hasReminder || !reminderDate || !reminderTime) return false;
    const [year, month, day] = reminderDate.split('-').map(Number);
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const d = new Date(year, month - 1, day, hours, minutes);
    return isBefore(d, new Date());
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

  const colorConfig = NOTE_COLORS[color] || NOTE_COLORS.indigo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-card border border-border rounded-3xl shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header / Action Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${colorConfig.dotClass}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {colorConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Toggle Checkboxes (Google Keep style) */}
            <button
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

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Copy text"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close / Save Button */}
            <button
              onClick={handleSaveAndClose}
              className="ml-1 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-xs hover:opacity-90 active:scale-95 transition-all"
            >
              {t.close}
            </button>
          </div>
        </div>

        {/* Scrollable Editor Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Note Title */}
          <div>
            <input
              type="text"
              placeholder={t.titlePlaceholder}
              value={title}
              onChange={handleTitleChange}
              autoFocus
              className="w-full text-xl sm:text-2xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/50 text-foreground"
            />
          </div>

          {/* Multiple Attached Images Gallery */}
          {images.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Attached Images ({images.length})</span>
                <span className="text-[11px] font-normal lowercase text-muted-foreground/80">
                  Click OCR on any image
                </span>
              </div>

              <div
                className={`grid gap-2.5 ${
                  images.length === 1
                    ? 'grid-cols-1'
                    : images.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {images.map((imgSrc, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-2xl overflow-hidden border border-border bg-black/5 dark:bg-black/30 aspect-4/3"
                  >
                    <img
                      src={imgSrc}
                      alt={`Attached ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Image overlay actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerOCR(idx)}
                        disabled={isOcrProcessing}
                        className="p-2 rounded-xl bg-white/90 text-zinc-900 hover:bg-white text-xs font-semibold flex items-center gap-1 shadow-md transition-all"
                        title="Extract text from this image"
                      >
                        {isOcrProcessing && activeOcrImageIndex === idx ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ScanText className="w-3.5 h-3.5 text-primary" />
                        )}
                        <span>OCR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-2 rounded-xl bg-rose-600/90 text-white hover:bg-rose-600 shadow-md transition-all"
                        title="Remove image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Link Badges (if URLs found in text) */}
          {extractedLinks.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Detected Links
              </span>
              <LinkBadgeList links={extractedLinks} />
            </div>
          )}

          {/* Note Body: Checklist mode OR Plain Text mode */}
          {noteType === 'checklist' ? (
            <ChecklistEditor items={checklist} onChange={setChecklist} />
          ) : (
            <div>
              <textarea
                ref={textareaRef}
                placeholder={t.notePlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[140px] text-sm sm:text-base leading-relaxed bg-transparent border-none resize-none focus:outline-none placeholder:text-muted-foreground/50 text-foreground"
              />
            </div>
          )}

          {/* Color Tag Picker */}
          <div className="pt-2 border-t border-border/60">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Color Tag
            </span>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {(Object.keys(NOTE_COLORS) as NoteColor[]).map((cKey) => {
                const conf = NOTE_COLORS[cKey];
                const isSelected = color === cKey;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setColor(cKey)}
                    className={`relative w-7 h-7 rounded-full ${conf.dotClass} flex items-center justify-center transition-transform hover:scale-110 shrink-0 ${
                      isSelected ? 'ring-3 ring-foreground/40 scale-105' : 'opacity-85'
                    }`}
                    title={conf.label}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminder Section */}
          <div className="pt-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className={`w-4 h-4 ${hasReminder ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium text-foreground">Remind me</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasReminder}
                  onChange={(e) => setHasReminder(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {hasReminder && (
              <div className="mt-3.5 space-y-3 p-3.5 bg-muted/40 rounded-2xl border border-border/70 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPresetReminder(1)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-background hover:bg-muted border border-border text-foreground transition-colors"
                  >
                    In 1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetReminder(3)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-background hover:bg-muted border border-border text-foreground transition-colors"
                  >
                    In 3 Hours
                  </button>
                  <button
                    type="button"
                    onClick={setTomorrowMorning}
                    className="px-2.5 py-1 text-xs rounded-lg bg-background hover:bg-muted border border-border text-foreground transition-colors"
                  >
                    Tomorrow 9 AM
                  </button>
                </div>

                {/* Custom Date & Time Inputs */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full pl-9 pr-2.5 py-1.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full pl-9 pr-2.5 py-1.5 text-xs bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {isReminderInPast() && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                    ⚠️ Selected reminder is set in the past.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Toolbar (Camera, Multiple Gallery Attachments, OCR) */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-1">
            {/* Hidden inputs (multiple allowed) */}
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

            {/* Gallery Multi-Image Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Attach Images"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Attach Images</span>
            </button>

            {/* Camera Capture */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Camera Capture"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Quick Checkbox Switch Button */}
            <button
              onClick={toggleCheckboxesMode}
              className={`p-2 rounded-xl transition-colors ${
                noteType === 'checklist'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Toggle checkboxes"
            >
              <CheckSquare className="w-4 h-4" />
            </button>

            {/* OCR Button for latest/first image */}
            {images.length > 0 && (
              <button
                onClick={() => handleTriggerOCR(0)}
                disabled={isOcrProcessing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/80 transition-colors shadow-xs"
                title="Extract text from image using OCR"
              >
                {isOcrProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <ScanText className="w-3.5 h-3.5 text-primary" />
                    <span>Grab Text (OCR)</span>
                  </>
                )}
              </button>
            )}
          </div>

          <button
            onClick={closeEditorModal}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
