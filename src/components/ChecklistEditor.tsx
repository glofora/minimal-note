import React, { useRef, useState } from 'react';
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

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({
  items,
  onChange,
}) => {
  const [showCompleted, setShowCompleted] = useState(true);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const activeItems = items.filter((item) => !item.isCompleted);
  const completedItems = items.filter((item) => item.isCompleted);

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
      // Insert new item directly after current
      const newItem: ChecklistItem = {
        id: generateUUID(),
        text: '',
        isCompleted: false,
      };
      const currentIndex = items.findIndex((i) => i.id === item.id);
      const next = [...items];
      next.splice(currentIndex + 1, 0, newItem);
      onChange(next);

      // Focus new input on next tick
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
    <div className="space-y-3 py-2">
      {/* Active (Uncompleted) Items */}
      <div className="space-y-1">
        {activeItems.map((item, index) => (
          <div
            key={item.id}
            className="group flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-muted/40 transition-colors"
          >
            <div className="text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Checkbox */}
            <button
              type="button"
              onClick={() => handleToggle(item.id)}
              className="w-4 h-4 rounded border-2 border-muted-foreground/50 hover:border-primary flex items-center justify-center shrink-0 transition-colors"
            >
              {item.isCompleted && <Check className="w-3 h-3 text-primary stroke-[3]" />}
            </button>

            {/* Input */}
            <input
              ref={(el) => {
                inputRefs.current[item.id] = el;
              }}
              type="text"
              value={item.text}
              placeholder="List item"
              onChange={(e) => handleTextChange(item.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index, item)}
              className="flex-1 bg-transparent border-none text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/40"
            />

            {/* Delete button */}
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Item Button */}
      <button
        type="button"
        onClick={handleAddNewItem}
        className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 py-1.5 px-2 rounded-xl hover:bg-primary/5 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>List item</span>
      </button>

      {/* Completed Items Section (Collapsible like Google Keep) */}
      {completedItems.length > 0 && (
        <div className="pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground py-1 transition-colors"
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
            <div className="mt-1.5 space-y-1 pl-2">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 py-1 px-1.5 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className="w-4 h-4 rounded bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs"
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
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded transition-all"
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
