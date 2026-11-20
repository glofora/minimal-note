import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NoteItem } from '@/types/note';
import { NOTE_COLORS } from '@/types/note';
import { formatReminderDate, formatNoteTimestamp, cleanFormattedSnippet } from '@/lib/utils';
import { useNotesStore } from '@/store/useNotesStore';
import {
  Bell,
  GripVertical,
  MoreVertical,
  Pin,
  Trash2,
  Share2,
  Copy,
  Check,
  CheckSquare,
  Palette,
} from 'lucide-react';
import { LinkBadgeList } from './LinkBadgeList';

interface NoteCardProps {
  note: NoteItem;
  is24Hour: boolean;
  onEdit: (note: NoteItem) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  is24Hour,
  onEdit,
}) => {
  const {
    toggleChecklistItem,
    togglePinNote,
    requestDeleteNote,
    openNoteReminderModal,
    openNoteColorModal,
    openImageGallery,
    preferences,
  } = useNotesStore();

  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
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

  // Normalize images list
  const noteImages: string[] =
    note.images && note.images.length > 0
      ? note.images
      : note.imageDataUrl
      ? [note.imageDataUrl]
      : [];

  // dnd-kit sortable for reordering
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const content =
      note.noteType === 'checklist' && note.checklist
        ? note.checklist.map((i) => `${i.isCompleted ? '✓' : '○'} ${i.text}`).join('\n')
        : note.description;
    const shareText = `${note.title}\n\n${content}\n\n— Sent via Minimal Note`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title || 'Note',
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const content =
      note.noteType === 'checklist' && note.checklist
        ? note.checklist.map((i) => `${i.isCompleted ? '✓' : '○'} ${i.text}`).join('\n')
        : note.description;
    const shareText = `${note.title}\n\n${content}`.trim();
    copyToClipboard(shareText);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    togglePinNote(note.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    requestDeleteNote(note.id, note.title);
  };

  const colorConfig = NOTE_COLORS[note.color] || NOTE_COLORS.indigo;

  // Checklist counts
  const checklistItems = note.checklist || [];
  const completedCount = checklistItems.filter((i) => i.isCompleted).length;
  const totalChecklist = checklistItems.length;

  const timestampStr = formatNoteTimestamp(note.updatedAt || note.createdAt, is24Hour);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative w-full rounded-xl sm:rounded-2xl select-none transition-shadow ${
        isDragging
          ? 'z-50 opacity-90 shadow-2xl scale-[1.01] ring-2 ring-primary/40'
          : isMenuOpen
          ? 'z-[500]'
          : 'z-0'
      }`}
    >
        <div
          onClick={() => onEdit(note)}
          className={`group relative flex flex-col gap-2 p-3 sm:p-3.5 bg-card hover:bg-card/90 dark:bg-card border ${colorConfig.borderLight} ${colorConfig.borderDark} rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-sm transition-all cursor-pointer w-full`}
        >
          {/* Top Bar: Handle + Color + Title + Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
                className="p-1 -ml-1 text-muted-foreground/30 hover:text-foreground active:text-primary cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>

              <span className={`w-2 h-2 rounded-full ${colorConfig.dotClass} shrink-0`} />

              {note.isPinned && (
                <Pin className="w-3.5 h-3.5 fill-primary text-primary -rotate-12 shrink-0" />
              )}

              <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight truncate">
                {note.title || 'Untitled Note'}
              </h3>
            </div>

            {/* Card Action Menu */}
            <div
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
              className="relative flex items-center gap-0.5 shrink-0"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted transition-colors cursor-pointer"
                title="More options"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Solid Opaque Floating Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[515] bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                    }}
                  />
                  <div
                    className="absolute right-0 top-full mt-1.5 w-44 py-1.5 bg-[#181824] dark:bg-[#181824] text-white border border-white/10 rounded-2xl shadow-2xl z-[520] animate-in fade-in zoom-in-95 duration-150"
                    role="menu"
                  >
                    <button
                      type="button"
                      onClick={handlePin}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 transition-colors text-left"
                      role="menuitem"
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-primary text-primary' : 'text-white/60'}`} />
                      <span>{note.isPinned ? 'Unpin Note' : 'Pin Note'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopy}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 transition-colors text-left"
                      role="menuitem"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-white/60" />
                      )}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-white/90 hover:bg-white/10 transition-colors text-left"
                      role="menuitem"
                    >
                      <Share2 className="w-3.5 h-3.5 text-white/60" />
                      <span>Share</span>
                    </button>

                    <div className="my-1 border-t border-white/10" />

                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors text-left"
                      role="menuitem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Compact Horizontal Image Collage / Preview Strip */}
          {noteImages.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {noteImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    openImageGallery(noteImages, idx);
                  }}
                  className="relative h-20 sm:h-24 w-24 sm:w-28 rounded-xl overflow-hidden border border-border/80 shrink-0 cursor-pointer hover:opacity-90 active:scale-95 transition-all bg-black/5 dark:bg-black/30 shadow-2xs"
                  title="Click to view full-screen gallery"
                >
                  <img
                    src={img}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/60 text-white text-[9px] font-mono">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Checklist preview or plain text snippet */}
          {note.noteType === 'checklist' && checklistItems.length > 0 ? (
            <div className="space-y-1 pt-0.5">
              {checklistItems.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChecklistItem(note.id, item.id);
                  }}
                  className="flex items-start gap-2.5 text-xs text-foreground/85 hover:text-foreground cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={() => {}}
                    className="w-3.5 h-3.5 mt-0.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer shrink-0"
                  />
                  <span
                    className={`whitespace-normal break-words leading-snug flex-1 ${
                      item.isCompleted
                        ? 'line-through text-muted-foreground/60'
                        : 'text-foreground'
                    }`}
                  >
                    {item.text || 'Empty item'}
                  </span>
                </div>
              ))}
              {checklistItems.length > 10 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(note);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline hover:text-primary/80 pt-0.5 cursor-pointer"
                >
                  <span>+{checklistItems.length - 10} more items</span>
                </button>
              )}
            </div>
          ) : (
            note.description && (
              <p className="text-xs text-muted-foreground/90 line-clamp-2 sm:line-clamp-3 leading-relaxed break-words">
                {cleanFormattedSnippet(note.description)}
              </p>
            )
          )}

          {/* Links */}
          {note.links && note.links.length > 0 && (
            <div className="pt-0.5">
              <LinkBadgeList links={note.links} />
            </div>
          )}

          {/* Bottom Card Bar: Timestamp + Compact Reminder & Color Modal Triggers */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground/75 font-medium flex-wrap mt-auto">
            {timestampStr && <span>{timestampStr}</span>}

            {note.hasReminder && note.reminderAt && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <Bell className="w-2.5 h-2.5" />
                <span>{formatReminderDate(note.reminderAt, is24Hour)}</span>
              </span>
            )}

            <div
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 ml-auto"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openNoteReminderModal(note);
                }}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  note.hasReminder && note.reminderAt
                    ? 'text-primary bg-primary/15'
                    : 'text-muted-foreground/50 hover:text-primary hover:bg-muted'
                }`}
                title="Reminder settings"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openNoteColorModal(note);
                }}
                className="p-1 rounded-md text-muted-foreground/50 hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                title="Color & tag settings"
              >
                <Palette className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};
