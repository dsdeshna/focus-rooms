// Sticky Notes (Repository pattern)
// Draggable personal notes that persist via NoteRepository.
// Notes are private to each user (enforced by Supabase RLS).

'use client';

import { useState, useEffect, useRef } from 'react';
import { NoteRepository } from '@/lib/repositories/NoteRepository';
import { StickyNote } from '@/types';
import { Plus, Trash2, X } from 'lucide-react';

interface StickyNotesProps {
  readonly roomId: string;
  readonly userId: string;
  readonly onClose: () => void;
}

export function StickyNotes({ roomId, userId, onClose }: StickyNotesProps) {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const noteRepo = useRef(new NoteRepository()).current;

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const userNotes = await noteRepo.findByUserAndRoom(userId, roomId);
        setNotes(userNotes);
      } catch (err) {
        console.error('Failed to load notes:', err);
      } finally {
        setLoading(false);
      }
    };
    loadNotes();
  }, [userId, roomId, noteRepo]);

  const handleAddNote = async () => {
    try {
      const newNote = await noteRepo.create(roomId, userId, '');
      setNotes(prev => [...prev, newNote]);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleUpdateContent = async (noteId: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, content } : n));
    try {
      await noteRepo.updateContent(noteId, content);
    } catch (err) {
      console.error('Failed to update note content:', err);
    }
  };

  const handleUpdatePosition = async (noteId: string, x: number, y: number) => {
    try {
      await noteRepo.updatePosition(noteId, x, y);
    } catch (err) {
      console.error('Failed to update note position:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await noteRepo.delete(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  return (
    <div className="sn-overlay">
      {/* Toolbar */}
      <div className="sn-toolbar">
        <button onClick={handleAddNote} className="sn-add-btn" id="add-note-btn">
          <Plus size={14} />
          new note
        </button>
        <button onClick={onClose} className="sn-close-btn" id="close-notes-btn" aria-label="Close notes">
          <X size={15} />
        </button>
      </div>

      {/* Notes */}
      {loading ? (
        <div className="sn-loading">
          <span>loading notes…</span>
        </div>
      ) : (
        notes.map((note, index) => (
          <DraggableNote
            key={note.id}
            note={note}
            index={index}
            onUpdateContent={handleUpdateContent}
            onUpdatePosition={handleUpdatePosition}
            onDelete={handleDeleteNote}
          />
        ))
      )}

      <style>{`
        .sn-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          pointer-events: none;
        }

        /* ── TOOLBAR ── */
        .sn-toolbar {
          position: absolute;
          top: 5rem;
          right: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          pointer-events: auto;
          animation: snFadeIn 0.4s ease both;
        }
        @keyframes snFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sn-add-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1.1rem;
          background: var(--color-text);
          color: var(--color-background);
          border: none;
          border-radius: 100px;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px -4px var(--color-shadow-lg);
        }
        .sn-add-btn:hover {
          background: var(--color-primary);
          transform: translateY(-2px);
        }

        .sn-close-btn {
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 50%;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all 0.25s ease;
        }
        .sn-close-btn:hover {
          background: var(--color-background);
          color: var(--color-text);
        }

        .sn-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
}

// ── Draggable Note ──────────────────────────────────────────────
const NOTE_PALETTES = [
  { bg: '#FFF9EC', border: '#F0E8CC' },  // warm cream
  { bg: '#F0F5F0', border: '#D8E8D8' },  // sage
  { bg: '#F5EFF5', border: '#E4D8E4' },  // lavender
  { bg: '#FDF0F0', border: '#F0DADA' },  // blush
  { bg: '#EFF4F9', border: '#D5E2EE' },  // mist blue
];

function DraggableNote({
  note, index, onUpdateContent, onUpdatePosition, onDelete,
}: {
  note: StickyNote;
  index: number;
  onUpdateContent: (id: string, content: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}) {
  const [position, setPosition] = useState({
    x: note.position_x || 80 + (index % 4) * 260,
    y: note.position_y || 120 + Math.floor(index / 4) * 220 + (index % 2) * 30,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const palette = NOTE_PALETTES[index % NOTE_PALETTES.length];

  const handleDragStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    const onUp = () => {
      setIsDragging(false);
      onUpdatePosition(note.id, position.x, position.y);
    };
    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup', onUp);
    return () => { globalThis.removeEventListener('mousemove', onMove); globalThis.removeEventListener('mouseup', onUp); };
  }, [isDragging, note.id, position.x, position.y, onUpdatePosition]);

  const handleContentChange = (content: string) => {
    onUpdateContent(note.id, content);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => onUpdateContent(note.id, content), 500);
  };

  return (
    <section
      className={`sn-note pointer-events-auto ${isDragging ? 'sn-note--dragging' : ''} ${isFocused ? 'sn-note--focused' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging || isFocused ? 100 : 50,
        background: palette.bg,
        borderColor: palette.border,
      }}
      aria-label={`Sticky note ${index + 1}`}
    >
      {/* Drag handle — this is the interactive element for dragging */}
      <div className="sn-note-header">
        <button
          className="sn-drag-handle"
          onMouseDown={handleDragStart}
          aria-label="Drag to reposition note"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
              if (!isFocused) onDelete(note.id);
            }
          }}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <span className="sn-note-label">✦ private</span>
        </button>
        <button
          className="sn-note-delete"
          onClick={() => onDelete(note.id)}
          aria-label="Delete note"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Textarea */}
      <textarea
        className="sn-note-textarea"
        value={note.content}
        onChange={e => handleContentChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="write something small…"
      />

      <style>{`
        .sn-note {
          position: absolute;
          width: 220px;
          padding: 1rem;
          border: 1px solid;
          border-radius: 1.25rem;
          box-shadow: 0 4px 20px -6px rgba(100,90,80,0.12),
                      2px 4px 0 rgba(100,90,80,0.04);
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          animation: noteIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          transition: box-shadow 0.3s ease;
          user-select: none;
        }
        @keyframes noteIn {
          from { opacity: 0; transform: scale(0.9) rotate(-2deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .sn-note--dragging {
          box-shadow: 0 16px 40px -8px rgba(100,90,80,0.25);
          transform: rotate(1deg);
        }
        .sn-note--focused {
          box-shadow: 0 8px 28px -6px rgba(100,90,80,0.18);
        }

        .sn-note-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sn-drag-handle {
          background: none;
          border: none;
          padding: 0.15rem 0.25rem;
          display: flex;
          align-items: center;
          flex: 1;
        }
        .sn-note-label {
          font-family: var(--font-sans);
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          opacity: 0.7;
          pointer-events: none;
        }
        .sn-note-delete {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          opacity: 0.4;
          display: flex;
          align-items: center;
          padding: 0.2rem;
          border-radius: 50%;
          transition: opacity 0.2s, background 0.2s;
        }
        .sn-note-delete:hover {
          opacity: 1;
          background: rgba(0,0,0,0.06);
          color: var(--color-danger);
        }

        .sn-note-textarea {
          width: 100%;
          min-height: 100px;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.85rem;
          color: var(--color-text);
          line-height: 1.7;
          cursor: text;
        }
        .sn-note-textarea::placeholder {
          color: var(--color-text-muted);
          opacity: 0.5;
        }
      `}</style>
    </section>
  );
}