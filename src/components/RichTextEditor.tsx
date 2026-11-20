import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  RemoveFormatting,
} from 'lucide-react';
import { formatDescriptionToHtml, sanitizeHtml } from '@/lib/sanitize';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your note here...',
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    unorderedList: false,
    orderedList: false,
  });

  // Track active formats based on current selection
  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current || !document.getSelection()?.anchorNode) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // Ignored if queryCommandState is unsupported in edge cases
    }
  }, []);

  // Sync external value to innerHTML when changed externally (or initial mount)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const formattedHtml = formatDescriptionToHtml(value);
    // Only update innerHTML if it doesn't match and editor is not currently actively typing
    if (editor.innerHTML !== formattedHtml && document.activeElement !== editor) {
      editor.innerHTML = formattedHtml;
    }
  }, [value]);

  // Handle format commands
  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, arg);
    updateActiveFormats();
    onChange(editor.innerHTML);
  };

  const handleLink = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    const url = window.prompt('Enter link URL (e.g. https://example.com):', 'https://');
    if (url && url.trim() && url !== 'https://') {
      const cleanUrl = url.trim();
      if (selectedText) {
        executeCommand('createLink', cleanUrl);
      } else {
        executeCommand('insertHTML', `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>`);
      }
    }
  };

  // Handle paste events to strip unwanted inline styles from external websites
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');

    if (html) {
      const sanitized = sanitizeHtml(html);
      document.execCommand('insertHTML', false, sanitized);
    } else if (text) {
      const paragraphs = text
        .split(/\n\s*\n/)
        .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');
      document.execCommand('insertHTML', false, paragraphs);
    }

    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle keydown for formatting shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        executeCommand('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        executeCommand('italic');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        executeCommand('underline');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleLink();
      }
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      // If content is just an empty break or spaces, treat as empty
      if (content === '<br>' || content === '<p><br></p>' || content === '<p></p>') {
        onChange('');
      } else {
        onChange(content);
      }
      updateActiveFormats();
    }
  };

  const isEmpty =
    !value ||
    value.trim() === '' ||
    value === '<br>' ||
    value === '<p><br></p>' ||
    value === '<p></p>';

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {/* Sleek Minimal Formatting Toolbar */}
      <div className="flex items-center gap-1 sm:gap-1.5 py-1 px-1.5 bg-muted/40 border border-border/50 rounded-xl overflow-x-auto no-scrollbar">
        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('bold');
          }}
          className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeFormats.bold
              ? 'bg-primary/20 text-primary font-extrabold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Bold (Ctrl+B)"
          aria-label="Format Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('italic');
          }}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            activeFormats.italic
              ? 'bg-primary/20 text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Italic (Ctrl+I)"
          aria-label="Format Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('underline');
          }}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            activeFormats.underline
              ? 'bg-primary/20 text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Underline (Ctrl+U)"
          aria-label="Format Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('strikeThrough');
          }}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            activeFormats.strikethrough
              ? 'bg-primary/20 text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Strikethrough"
          aria-label="Format Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-border/60 mx-0.5 shrink-0" />

        {/* Bulleted List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('insertUnorderedList');
          }}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            activeFormats.unorderedList
              ? 'bg-primary/20 text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Bulleted List"
          aria-label="Insert Bulleted List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('insertOrderedList');
          }}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            activeFormats.orderedList
              ? 'bg-primary/20 text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Numbered List"
          aria-label="Insert Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-border/60 mx-0.5 shrink-0" />

        {/* Insert Link */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleLink();
          }}
          className="p-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title="Insert Link (Ctrl+K)"
          aria-label="Insert Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* Remove Formatting */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand('removeFormat');
          }}
          className="p-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ml-auto"
          title="Clear Formatting"
          aria-label="Clear Formatting"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* WYSIWYG contentEditable Writing Area */}
      <div className="relative min-h-[180px]">
        {/* Clean Placeholder text overlay when empty */}
        {isEmpty && (
          <div
            onClick={() => editorRef.current?.focus()}
            className="absolute top-1 left-1 text-sm sm:text-base text-muted-foreground/40 pointer-events-none select-none font-normal leading-relaxed"
          >
            {placeholder}
          </div>
        )}

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onSelect={updateActiveFormats}
          className="w-full min-h-[180px] text-sm sm:text-base leading-relaxed bg-transparent border-none focus:outline-none text-foreground py-1 px-1 transition-all break-words [&>p]:mb-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-2 [&>a]:text-primary [&>a]:underline [&>strong]:font-bold [&>b]:font-bold"
          role="textbox"
          aria-multiline="true"
          aria-label="Note Description"
        />
      </div>
    </div>
  );
};
