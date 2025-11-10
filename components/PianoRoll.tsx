import React, { useState, useRef } from 'react';
import type { Note } from '../types';
import { PIANO_ROLL_NOTES, JAPANESE_NOTE_NAMES } from '../constants';

interface PianoRollProps {
  notes: Note[];
  bars: number;
  currentStep: number;
  isPlaying: boolean;
  onNotesChange: (notes: Note[]) => void;
  zoom: number;
}

const ROW_HEIGHT_REM = 1.5;

export const PianoRoll: React.FC<PianoRollProps> = ({ notes, bars, currentStep, isPlaying, onNotesChange, zoom }) => {
  const steps = bars * 16;
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const dragInfoRef = useRef<{ noteId: string; startX: number; startY: number; startBeat: number; startPitchIndex: number; } | null>(null);
  const resizeInfoRef = useRef<{ noteId: string; startX: number; startDuration: number } | null>(null);

  const STEP_WIDTH_REM = 1.5 * zoom;

  const getStepAndPitchFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const stepWidthPx = STEP_WIDTH_REM * rootFontSize;
    const rowHeightPx = ROW_HEIGHT_REM * rootFontSize;

    const step = Math.floor(x / stepWidthPx);
    const pitchIndex = Math.floor(y / rowHeightPx);
    const pitch = PIANO_ROLL_NOTES[pitchIndex];

    return { step, pitch };
  };

  const handleGridDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-role="note"]')) return;

    const info = getStepAndPitchFromEvent(e);
    if (!info || !info.pitch) return;
    const { step, pitch } = info;

    const newNote = { id: `note-${Date.now()}`, pitch, startBeat: step / 4, duration: 0.25 };
    onNotesChange([...notes, newNote]);
  };

  const handleNoteDoubleClick = (noteToDelete: Note) => {
    onNotesChange(notes.filter(n => n.id !== noteToDelete.id));
  };
  
  const handleNotePointerDown = (e: React.PointerEvent<HTMLDivElement>, note: Note) => {
    e.stopPropagation();
    setSelectedNoteId(note.id);
    
    dragInfoRef.current = {
      noteId: note.id,
      startX: e.clientX,
      startY: e.clientY,
      startBeat: note.startBeat,
      startPitchIndex: PIANO_ROLL_NOTES.indexOf(note.pitch),
    };
    
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const stepWidthPx = STEP_WIDTH_REM * rootFontSize;
    const rowHeightPx = ROW_HEIGHT_REM * rootFontSize;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragInfoRef.current) return;

      const dx = moveEvent.clientX - dragInfoRef.current.startX;
      const dy = moveEvent.clientY - dragInfoRef.current.startY;

      const dSteps = Math.round(dx / stepWidthPx);
      const dPitch = Math.round(dy / rowHeightPx);
      
      const newStartStep = Math.max(0, Math.round(dragInfoRef.current.startBeat * 4) + dSteps);
      const newPitchIndex = Math.min(PIANO_ROLL_NOTES.length - 1, Math.max(0, dragInfoRef.current.startPitchIndex + dPitch));
      
      onNotesChange(notes.map(n => 
        n.id === dragInfoRef.current!.noteId 
        ? { ...n, startBeat: newStartStep / 4, pitch: PIANO_ROLL_NOTES[newPitchIndex] } 
        : n
      ));
    };
    
    const handlePointerUp = () => {
      dragInfoRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  
  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>, note: Note) => {
    e.stopPropagation();
    e.preventDefault();
    
    resizeInfoRef.current = { noteId: note.id, startX: e.clientX, startDuration: note.duration };
    
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!resizeInfoRef.current) return;
        const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const stepWidthPx = STEP_WIDTH_REM * rootFontSize;
        const dx = moveEvent.clientX - resizeInfoRef.current.startX;
        const dSteps = Math.round(dx / stepWidthPx);
        const newDurationSteps = Math.max(1, Math.round(resizeInfoRef.current.startDuration * 4) + dSteps);
        
        onNotesChange(notes.map(n => n.id === resizeInfoRef.current!.noteId ? { ...n, duration: newDurationSteps / 4 } : n));
    };

    const handlePointerUp = () => {
        resizeInfoRef.current = null;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedNoteId(null);
    }
  }

  return (
    <div className="relative h-full" ref={gridRef} onDoubleClick={handleGridDoubleClick} onClick={handleBackgroundClick}>
      {/* Background Grid */}
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${steps}, ${STEP_WIDTH_REM}rem)` }}>
        {Array.from({ length: PIANO_ROLL_NOTES.length * steps }).map((_, i) => {
          const stepIndex = i % steps;
          const isBeat = stepIndex % 4 === 0;
          return (
            <div
              key={i}
              className={`border-b border-r 
                ${isBeat ? 'border-l-gray-600' : 'border-l-gray-700'} 
                border-t-transparent border-r-gray-700 border-b-gray-700`}
              style={{ height: `${ROW_HEIGHT_REM}rem` }}
            />
          );
        })}
      </div>

      {/* Notes */}
      <div className="absolute inset-0">
        {notes.map((note) => {
          const noteIndex = PIANO_ROLL_NOTES.indexOf(note.pitch);
          if (noteIndex === -1) return null;
          const startStep = note.startBeat * 4;
          const durationSteps = note.duration * 4;
          const isSelected = note.id === selectedNoteId;

          return (
            <div
              key={note.id}
              data-role="note"
              onPointerDown={(e) => handleNotePointerDown(e, note)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleNoteDoubleClick(note);
              }}
              className={`absolute rounded flex items-center select-none cursor-grab transition-all duration-75 ease-in-out ${
                isSelected 
                  ? 'bg-cyan-400 ring-2 ring-offset-2 ring-offset-gray-800 ring-white shadow-lg' 
                  : 'bg-cyan-500 shadow-md'
              }`}
              style={{
                top: `${noteIndex * ROW_HEIGHT_REM}rem`,
                left: `${startStep * STEP_WIDTH_REM}rem`,
                width: `${durationSteps * STEP_WIDTH_REM}rem`,
                height: `${ROW_HEIGHT_REM}rem`,
                touchAction: 'none',
              }}
            >
              <span className="text-xs text-black/70 pl-1 pointer-events-none truncate">
                {JAPANESE_NOTE_NAMES[note.pitch] || note.pitch}
              </span>
              <div
                data-role="note-resize-handle"
                onPointerDown={(e) => handleResizeStart(e, note)}
                className="absolute right-0 top-0 w-3 h-full cursor-ew-resize hover:bg-white/30 rounded-r"
                style={{ touchAction: 'none' }}
              />
            </div>
          );
        })}
      </div>

      {/* Playhead */}
      {isPlaying && (
        <div
          className="absolute top-0 bottom-0 w-1 bg-red-500/70 pointer-events-none"
          style={{ left: `${currentStep * STEP_WIDTH_REM}rem` }}
        />
      )}
    </div>
  );
};