# Minimal Note (Web & PWA)

A clean, modern, offline-first personal notes and checklist application built with React 19, TypeScript, Tailwind CSS, and IndexedDB.

---

## Capabilities

- **Checklists & Structured Lists**:
  - Interactive checkboxes with instant strike-through.
  - Automatic organization of finished items into a collapsible section.
  - Keyboard workflow: press Enter to create the next list item; press Backspace on an empty item to remove it.
  - Toggle freely between checklist mode and freeform text mode.

- **Multiple Image Attachments**:
  - Add multiple images to any note via file upload or camera capture.
  - Automatic client-side canvas scaling (max 640px dimension) to optimize memory and local storage.
  - Thumbnail preview grid with individual image management.

- **Client-Side Text Recognition (OCR)**:
  - In-browser Optical Character Recognition using WebAssembly (`tesseract.js`).
  - Extract text directly from attached images into note content without sending data to external servers.

- **Interactive URL Detection**:
  - Automatic detection of web links inside note text.
  - Formatted link badges showing website domain, direct external link, and quick copy action.

- **Scheduled Reminders**:
  - Set custom date and time alerts with 12-hour or 24-hour display support.
  - Fast presets (1 hour, 3 hours, next morning).
  - Built-in snooze controls (10, 30, and 60 minutes) upon reminder trigger.

- **Gestures & Organization**:
  - Drag-and-drop manual reordering of notes using `@dnd-kit`.
  - Horizontal swipe-to-delete gesture with an undo snackbar.
  - Nine distinct color tags with coordinated light and dark mode styles.

- **Offline Storage & Privacy**:
  - Stores all data locally in the browser using IndexedDB via `Dexie.js`.
  - Export and restore notes via structured JSON files.
  - Dark, light, and system theme modes.

---

## Technology Stack

- **UI & Runtime**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Local Persistence**: Dexie.js (IndexedDB)
- **State Management**: Zustand
- **Motion & Interaction**: Framer Motion, @dnd-kit
- **Image Processing & OCR**: HTML5 Canvas API, Tesseract.js
- **Icons & Dates**: Lucide React, date-fns

---

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm, pnpm, or yarn

### Setup

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview the production build locally:
   ```bash
   npm run preview
   ```

---

## Directory Overview

```
src/
├── components/          # UI components (cards, editor, lists, dialogs)
├── lib/                 # Database helpers, image scaling, and utilities
├── store/               # Application state store (Zustand)
├── types/               # TypeScript data definitions
├── App.tsx              # Main application view
├── main.tsx             # Application bootstrap
└── index.css            # Styles and theme variable definitions
```

---

## License

This project is released under the [MIT License](LICENSE).
