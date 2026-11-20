import React, { useRef, useState } from 'react';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ChecklistItem } from '@/types/note';
import { generateUUID } from '@/lib/utils';
import {
  Check,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

interface SortableChecklistItemProps {
  item: ChecklistItem;
  index: number;
  inputRef: (el: HTMLInputElement | null) => void;
  onToggle: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const SortableChecklistItem: React.FC<SortableChecklistItemProps> = ({
  item,
  inputRef,
  onToggle,
  onTextChange,
  onDelete,
  onKeyDown,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 py-1 px-1.5 rounded-xl transition-all ${
        isDragging
          ? 'z-40 bg-muted/90 shadow-md scale-[1.01] ring-1 ring-primary/30'
          : 'hover:bg-muted/40'
      }`}
    >
      {/* Dedicated Drag Handle for Mobile & Desktop */}
      <div
        {...attributes}
        {...listeners}
        className="p-1 -ml-0.5 text-muted-foreground/40 hover:text-foreground active:text-primary cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
        title="Drag to reorder"
        aria-label="Drag to reorder checklist item"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        className="w-4 h-4 rounded border-2 border-muted-foreground/50 hover:border-primary flex items-center justify-center shrink-0 transition-colors cursor-pointer"
      >
        {item.isCompleted && <Check className="w-3 h-3 text-primary stroke-[3]" />}
      </button>

      {/* Text Input */}
      <input
        ref={inputRef}
        type="text"
        value={item.text}
        placeholder="List item"
        onChange={(e) => onTextChange(item.id, e.target.value)}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent border-none text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/40"
      />

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded transition-all cursor-pointer"
        title="Delete item"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({
  items,
  onChange,
}) => {
  const [showCompleted, setShowCompleted] = useState(true);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const activeItems = items.filter((item) => !item.isCompleted);
  const completedItems = items.filter((item) => item.isCompleted);

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
      const oldIndex = activeItems.findIndex((i) => i.id === active.id);
      const newIndex = activeItems.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedActive = [...activeItems];
        const [moved] = reorderedActive.splice(oldIndex, 1);
        reorderedActive.splice(newIndex, 0, moved);

        const newItems = [...reorderedActive, ...completedItems];
        onChange(newItems);
      }
    }
  };

  const handleToggle = (id: string) => {
    const next = items.map((item) =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    onChange(next);
  };

  const handleTextChange = (id: string, text: string) => {
    const next = items.map((item) =>
      item.id === id ? { ...item, text } : item
    );
    onChange(next);
  };

  const handleDelete = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    onChange(next);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    item: ChecklistItem
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Insert new item directly after current active item
      const newItem: ChecklistItem = {
        id: generateUUID(),
        text: '',
        isCompleted: false,
      };
      const currentIndex = items.findIndex((i) => i.id === item.id);
      const next = [...items];
      next.splice(currentIndex + 1, 0, newItem);
      onChange(next);

      setTimeout(() => {
        inputRefs.current[newItem.id]?.focus();
      }, 50);
    } else if (e.key === 'Backspace' && item.text === '' && items.length > 1) {
      e.preventDefault();
      const currentIndex = items.findIndex((i) => i.id === item.id);
      const prevItem = items[currentIndex - 1] || items[currentIndex + 1];
      handleDelete(item.id);

      if (prevItem) {
        setTimeout(() => {
          inputRefs.current[prevItem.id]?.focus();
        }, 50);
      }
    }
  };

  const handleAddNewItem = () => {
    const newItem: ChecklistItem = {
      id: generateUUID(),
      text: '',
      isCompleted: false,
    };
    onChange([...items, newItem]);
    setTimeout(() => {
      inputRefs.current[newItem.id]?.focus();
    }, 50);
  };

  return (
    <div className="space-y-3 py-1">
      {/* Active (Uncompleted) Sortable Items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeItems.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
            {activeItems.map((item, index) => (
              <SortableChecklistItem
                key={item.id}
                item={item}
                index={index}
                inputRef={(el) => {
                  inputRefs.current[item.id] = el;
                }}
                onToggle={handleToggle}
                onTextChange={handleTextChange}
                onDelete={handleDelete}
                onKeyDown={(e) => handleKeyDown(e, index, item)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add New Item Button */}
      <button
        type="button"
        onClick={handleAddNewItem}
        className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 py-1.5 px-2 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>List item</span>
      </button>

      {/* Completed Items Section (Collapsible) */}
      {completedItems.length > 0 && (
        <div className="pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground py-1 transition-colors cursor-pointer"
          >
            {showCompleted ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>
              {completedItems.length} completed {completedItems.length === 1 ? 'item' : 'items'}
            </span>
          </button>

          {showCompleted && (
            <div className="mt-1 space-y-0.5 pl-6">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className="w-4 h-4 rounded bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </button>

                  {/* Checked text */}
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleTextChange(item.id, e.target.value)}
                    className="flex-1 bg-transparent border-none text-sm text-muted-foreground line-through focus:outline-none"
                  />

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded transition-all cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
