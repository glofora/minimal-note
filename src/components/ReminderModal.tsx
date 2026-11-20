import React, { useState } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import type { SnoozeDuration } from '@/types/note';
import { Bell, Clock, Check, X, ArrowRight } from 'lucide-react';
import { formatReminderDate } from '@/lib/utils';

export const ReminderModal: React.FC = () => {
  const { dueReminderNote, snoozeReminder, dismissReminder, openEditModal, preferences } =
    useNotesStore();
  const [snoozeMinutes, setSnoozeMinutes] = useState<SnoozeDuration>(10);

  if (!dueReminderNote) return null;

  const handleSnooze = () => {
    snoozeReminder(dueReminderNote.id, snoozeMinutes);
  };

  const handleDismiss = () => {
    dismissReminder(dueReminderNote.id);
  };

  const handleViewNote = () => {
    const note = dueReminderNote;
    dismissReminder(dueReminderNote.id);
    openEditModal(note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Reminder Due
            </span>
            <h3 className="text-lg font-bold text-foreground truncate max-w-[260px]">
              {dueReminderNote.title || 'Untitled Note'}
            </h3>
          </div>
        </div>

        {dueReminderNote.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 bg-muted/40 p-3 rounded-xl border border-border/60">
            {dueReminderNote.description}
          </p>
        )}

        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled for: {formatReminderDate(dueReminderNote.reminderAt, preferences.is24HourFormat)}</span>
        </div>

        {/* Snooze Select */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Snooze Duration
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[10, 30, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSnoozeMinutes(mins as SnoozeDuration)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  snoozeMinutes === mins
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/50 border-border text-foreground hover:bg-muted'
                }`}
              >
                {mins} mins
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <button
            onClick={handleDismiss}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark Done</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleViewNote}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="View full note"
            >
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleSnooze}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-xs"
            >
              Snooze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
