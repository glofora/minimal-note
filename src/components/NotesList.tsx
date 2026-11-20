import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useNotesStore } from '@/store/useNotesStore';
import { getTranslation } from '@/lib/i18n';
import { NoteCard } from './NoteCard';
import { Plus, StickyNote, Sparkles, CheckSquare, Pin } from 'lucide-react';
import type { NoteItem } from '@/types/note';

export const NotesList: React.FC = () => {
  const {
    notes,
    isLoading,
    searchQuery,
    filterColor,
    preferences,
    openCreateModal,
    openEditModal,
    reorderNotes,
  } = useNotesStore();

  const t = getTranslation(preferences.language);
  const [isFabOpen, setIsFabOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderNotes(active.id as string, over.id as string);
    }
  };

  // Filter notes
  const filteredNotes = React.useMemo(() => {
    return notes.filter((item) => {
      // Color filter
      if (filterColor !== 'all' && item.color !== filterColor) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = item.description.toLowerCase().includes(query);
        const checklistMatch = (item.checklist || []).some((c) =>
          c.text.toLowerCase().includes(query)
        );
        const linkMatch = (item.links || []).some((l) =>
          l.toLowerCase().includes(query)
        );
        return titleMatch || descMatch || checklistMatch || linkMatch;
      }
      return true;
    });
  }, [notes, filterColor, searchQuery]);

  // Split into Pinned and Others
  const pinnedNotes = React.useMemo(
    () => filteredNotes.filter((n) => Boolean(n.isPinned)),
    [filteredNotes]
  );
  const otherNotes = React.useMemo(
    () => filteredNotes.filter((n) => !n.isPinned),
    [filteredNotes]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-sm text-muted-foreground font-medium">{t.loadingNotes}</span>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-2.5 py-3 sm:px-6 sm:py-5 relative min-h-[calc(100vh-130px)] pb-28">
      {/* Empty State */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
              <StickyNote className="w-10 h-10" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-accent dark:bg-accent/30 flex items-center justify-center text-primary border-2 border-background">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {searchQuery || filterColor !== 'all' ? t.noMatchingTitle : t.emptyWorkspaceTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {searchQuery || filterColor !== 'all'
              ? t.noMatchingDesc
              : t.emptyWorkspaceDesc}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => openCreateModal(undefined, 'text')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-md shadow-primary/25 hover:opacity-95 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>{t.newNote}</span>
            </button>

            <button
              onClick={() => openCreateModal(undefined, 'checklist')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-sm border border-border transition-colors"
            >
              <CheckSquare className="w-4 h-4 text-primary" />
              <span>{t.newList}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Sortable List */
        (() => {
          const isTileView = preferences.viewMode === 'tile';
          const sortingStrategy = isTileView ? rectSortingStrategy : verticalListSortingStrategy;
          const containerClass = isTileView
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-start'
            : 'flex flex-col gap-3 sm:gap-4 w-full';

          return (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {pinnedNotes.length > 0 ? (
                <div className="space-y-4">
                  {/* Pinned Notes Section */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <Pin className="w-3.5 h-3.5 text-primary fill-primary -rotate-12" />
                      <span>Pinned ({pinnedNotes.length})</span>
                    </div>
                    <SortableContext
                      items={pinnedNotes.map((n) => n.id)}
                      strategy={sortingStrategy}
                    >
                      <div className={containerClass}>
                        {pinnedNotes.map((note: NoteItem) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            is24Hour={preferences.is24HourFormat}
                            onEdit={openEditModal}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>

                  {/* Others Notes Section */}
                  {otherNotes.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Others ({otherNotes.length})</span>
                      </div>
                      <SortableContext
                        items={otherNotes.map((n) => n.id)}
                        strategy={sortingStrategy}
                      >
                        <div className={containerClass}>
                          {otherNotes.map((note: NoteItem) => (
                            <NoteCard
                              key={note.id}
                              note={note}
                              is24Hour={preferences.is24HourFormat}
                              onEdit={openEditModal}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  )}
                </div>
              ) : (
                /* Single List when no notes are pinned */
                <SortableContext
                  items={filteredNotes.map((n) => n.id)}
                  strategy={sortingStrategy}
                >
                  <div className={containerClass}>
                    {filteredNotes.map((note: NoteItem) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        is24Hour={preferences.is24HourFormat}
                        onEdit={openEditModal}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </DndContext>
          );
        })()
      )}

      {/* Floating Action Speed Dial (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2.5">
        {isFabOpen && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* New Checklist Button */}
            <button
              onClick={() => {
                setIsFabOpen(false);
                openCreateModal(undefined, 'checklist');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card text-foreground border border-border shadow-lg hover:bg-muted transition-all text-xs font-semibold"
            >
              <CheckSquare className="w-4 h-4 text-primary" />
              <span>{t.checklist}</span>
            </button>

            {/* New Text Note Button */}
            <button
              onClick={() => {
                setIsFabOpen(false);
                openCreateModal(undefined, 'text');
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card text-foreground border border-border shadow-lg hover:bg-muted transition-all text-xs font-semibold"
            >
              <StickyNote className="w-4 h-4 text-primary" />
              <span>{t.textNote}</span>
            </button>
          </div>
        )}

        {/* Main Floating Action Button */}
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/35 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 ${
            isFabOpen ? 'rotate-45' : ''
          }`}
          title="Add Note or Checklist"
        >
          <Plus className="w-6 h-6 stroke-[2.5] transition-transform duration-200" />
        </button>
      </div>
    </main>
  );
};
