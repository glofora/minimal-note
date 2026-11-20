import React, { useState, useEffect } from 'react';
import { useNotesStore } from '@/store/useNotesStore';
import { getTranslation } from '@/lib/i18n';
import { Bell, Calendar, Clock, Trash2, X } from 'lucide-react';
import { addHours, format, setHours, setMinutes } from 'date-fns';

export const NoteReminderModal: React.FC = () => {
  const {
    noteForReminderModal,
    closeNoteReminderModal,
    updateNoteReminder,
    preferences,
  } = useNotesStore();

  const t = getTranslation(preferences.language);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (noteForReminderModal) {
      if (noteForReminderModal.reminderAt) {
        const d = new Date(noteForReminderModal.reminderAt);
        setDate(format(d, 'yyyy-MM-dd'));
        setTime(format(d, 'HH:mm'));
      } else {
        const nextHour = addHours(new Date(), 1);
        setDate(format(nextHour, 'yyyy-MM-dd'));
        setTime(format(nextHour, 'HH:mm'));
      }
    }
  }, [noteForReminderModal]);

  if (!noteForReminderModal) return null;

  const handlePreset = (hoursFromNow: number) => {
    const target = addHours(new Date(), hoursFromNow);
    setDate(format(target, 'yyyy-MM-dd'));
    setTime(format(target, 'HH:mm'));
  };

  const handleTomorrowMorning = () => {
    const tomorrow = setMinutes(setHours(addHours(new Date(), 24), 9), 0);
    setDate(format(tomorrow, 'yyyy-MM-dd'));
    setTime(format(tomorrow, 'HH:mm'));
  };

  const handleSave = () => {
    if (!date || !time) return;
    try {
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const combined = new Date(year, month - 1, day, hours, minutes);
      updateNoteReminder(noteForReminderModal.id, combined.toISOString());
    } catch (e) {
      console.warn('Failed to parse reminder date', e);
    }
  };

  const handleClear = () => {
    updateNoteReminder(noteForReminderModal.id, null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={closeNoteReminderModal}
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
              <h3 id="reminder-modal-title" className="text-base font-bold text-foreground">
                {t.remindMe}
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {noteForReminderModal.title || 'Untitled Note'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeNoteReminderModal}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              onClick={() => handlePreset(1)}
              className="px-2.5 py-1 text-xs rounded-xl bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              In 1 Hour
            </button>
            <button
              type="button"
              onClick={() => handlePreset(3)}
              className="px-2.5 py-1 text-xs rounded-xl bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              In 3 Hours
            </button>
            <button
              type="button"
              onClick={handleTomorrowMorning}
              className="px-2.5 py-1 text-xs rounded-xl bg-muted/60 hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              Tomorrow 9 AM
            </button>
          </div>
        </div>

        {/* Custom Pickers */}
        <div className="space-y-2 pt-1">
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="relative">
            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-muted/40 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {noteForReminderModal.hasReminder ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeNoteReminderModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              {t.saveNote}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
