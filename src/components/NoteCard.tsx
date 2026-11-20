import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import type { NoteItem } from '@/types/note';
import { NOTE_COLORS } from '@/types/note';
import { formatReminderDate } from '@/lib/utils';
import { useNotesStore } from '@/store/useNotesStore';
import {
  Bell,
  GripVertical,
  Trash2,
  Share2,
  Copy,
  Check,
  CheckSquare,
} from 'lucide-react';
import { LinkBadgeList } from './LinkBadgeList';

interface NoteCardProps {
  note: NoteItem;
  is24Hour: boolean;
  onEdit: (note: NoteItem) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, is24Hour, onEdit }) => {
  const { deleteNote, toggleChecklistItem } = useNotesStore();
  const [copied, setCopied] = React.useState(false);

  // Normalize images list
  const noteImages: string[] =
    note.images && note.images.length > 0
      ? note.images
      : note.imageDataUrl
      ? [note.imageDataUrl]
      : [];

  // dnd-kit sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Framer motion swipe-to-delete
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-180, 0, 180], [0, 1, 0]);
  const actionBackground = useTransform(
    x,
    [-150, -20, 0, 20, 150],
    [
      'rgba(239, 68, 68, 0.95)',
      'rgba(239, 68, 68, 0.4)',
      'transparent',
      'rgba(239, 68, 68, 0.4)',
      'rgba(239, 68, 68, 0.95)',
    ]
  );

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 140) {
      deleteNote(note.id);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const colorConfig = NOTE_COLORS[note.color] || NOTE_COLORS.indigo;
  const initialChar = note.title.trim().charAt(0).toUpperCase() || '•';

  // Checklist counts
  const checklistItems = note.checklist || [];
  const completedCount = checklistItems.filter((i) => i.isCompleted).length;
  const totalChecklist = checklistItems.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative rounded-2xl select-none transition-shadow ${
        isDragging ? 'z-50 opacity-80 shadow-2xl scale-[1.02]' : 'z-10'
      }`}
    >
      {/* Background delete indicator during swipe */}
      <motion.div
        style={{ backgroundColor: actionBackground }}
        className="absolute inset-0 rounded-2xl flex items-center justify-between px-6 text-white overflow-hidden pointer-events-none"
      >
        <div className="flex items-center gap-2 font-medium text-sm">
          <Trash2 className="w-5 h-5 animate-pulse" />
          <span>Delete</span>
        </div>
        <div className="flex items-center gap-2 font-medium text-sm">
          <span>Delete</span>
          <Trash2 className="w-5 h-5 animate-pulse" />
        </div>
      </motion.div>

      {/* Foreground card */}
      <motion.div
        style={{ x, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        onClick={() => onEdit(note)}
        className={`group relative flex items-start gap-3.5 p-4 bg-card hover:bg-card/90 dark:bg-card border ${colorConfig.borderLight} ${colorConfig.borderDark} rounded-2xl shadow-xs hover:shadow-md transition-all cursor-pointer`}
      >
        {/* Drag Reorder Handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 p-1 -ml-1 text-muted-foreground/30 group-hover:text-muted-foreground/80 hover:bg-muted rounded cursor-grab active:cursor-grabbing transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Circular Avatar / Primary Thumbnail */}
        <div className="shrink-0 mt-0.5">
          {noteImages.length > 0 ? (
            <div className="relative">
              <img
                src={noteImages[0]}
                alt="Attachment"
                className="w-11 h-11 rounded-full object-cover border-2 border-border/80 shadow-xs"
              />
              {noteImages.length > 1 && (
                <span className="absolute -bottom-1 -right-1 px-1 py-0.2 bg-primary text-primary-foreground font-mono font-bold text-[9px] rounded-full border border-background shadow-xs">
                  +{noteImages.length - 1}
                </span>
              )}
            </div>
          ) : (
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-white shadow-xs ${colorConfig.dotClass}`}
            >
              <span className="text-base tracking-wide">{initialChar}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1 space-y-2">
          {/* Title & Quick Actions */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-base text-foreground leading-snug truncate">
                {note.title || 'Untitled Note'}
              </h3>
              {note.noteType === 'checklist' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground shrink-0">
                  <CheckSquare className="w-2.5 h-2.5" />
                  <span>
                    {completedCount}/{totalChecklist}
                  </span>
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 transition-opacity shrink-0"
            >
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Share note"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => deleteNote(note.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Multiple Images Thumbnail Strip (if 2+ images) */}
          {noteImages.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 overflow-x-auto py-1"
            >
              {noteImages.slice(0, 4).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumb ${idx + 1}`}
                  onClick={() => onEdit(note)}
                  className="w-16 h-12 rounded-xl object-cover border border-border shadow-2xs hover:opacity-90 transition-opacity"
                />
              ))}
              {noteImages.length > 4 && (
                <div
                  onClick={() => onEdit(note)}
                  className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0"
                >
                  +{noteImages.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Checklist Mode: Interactive items directly on the card! (like Google Keep) */}
          {note.noteType === 'checklist' && checklistItems.length > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="space-y-1.5 py-0.5 text-xs text-foreground"
            >
              {checklistItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(note.id, item.id)}
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                      item.isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/60'
                    }`}
                  >
                    {item.isCompleted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span
                    className={`truncate ${
                      item.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {item.text || 'Item'}
                  </span>
                </div>
              ))}
              {checklistItems.length > 4 && (
                <span className="text-[11px] text-muted-foreground/75 font-medium block">
                  +{checklistItems.length - 4} more items
                </span>
              )}
            </div>
          ) : (
            /* Plain Text Mode: Description snippet */
            note.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed whitespace-pre-wrap">
                {note.description}
              </p>
            )
          )}

          {/* Extracted Interactive Links Badges */}
          {note.links && note.links.length > 0 && (
            <div onClick={(e) => e.stopPropagation()}>
              <LinkBadgeList links={note.links} />
            </div>
          )}

          {/* Reminder Badge */}
          {note.hasReminder && note.reminderAt && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Bell className="w-3 h-3 shrink-0" />
              <span>{formatReminderDate(note.reminderAt, is24Hour)}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
