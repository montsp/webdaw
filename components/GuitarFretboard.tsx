
import React from 'react';
import { PIANO_ROLL_NOTES } from '../constants.ts';

interface GuitarFretboardProps {
  playNotePreview: (pitch: string) => void;
}

const NUM_FRETS = 24;
const FRET_WIDTH = 80;
const STRING_SPACING = 25;
const FRETBOARD_HEIGHT = 5 * STRING_SPACING + 20;
const FRETBOARD_WIDTH = (NUM_FRETS + 1) * FRET_WIDTH;
const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

// 計算用に低音から高音へ並べたノート配列
const ALL_NOTES = PIANO_ROLL_NOTES.slice().reverse(); 
// 表示用に高音Eから低音Eへ並べた開放弦
const OPEN_STRINGS = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];

const getNoteForStringAndFret = (stringIndex: number, fret: number): string | null => {
  const openStringNote = OPEN_STRINGS[stringIndex];
  const openStringIndexInAllNotes = ALL_NOTES.indexOf(openStringNote);
  if (openStringIndexInAllNotes === -1) return null;
  
  const targetNoteIndex = openStringIndexInAllNotes + fret;
  if (targetNoteIndex >= 0 && targetNoteIndex < ALL_NOTES.length) {
    return ALL_NOTES[targetNoteIndex];
  }
  return null;
};

// FIX: Corrected typo from GuitarFletboardProps to GuitarFretboardProps
export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({ playNotePreview }) => {

  const handleFretClick = (stringIndex: number, fret: number) => {
    const note = getNoteForStringAndFret(stringIndex, fret);
    if (note) {
      playNotePreview(note);
    }
  };

  return (
    <div className="overflow-x-auto bg-gray-900 h-48 flex-shrink-0 border-t-2 border-gray-700 select-none flex items-center">
      <svg width={FRETBOARD_WIDTH} height={FRETBOARD_HEIGHT} style={{ minWidth: FRETBOARD_WIDTH }}>
        {/* 指板 */}
        <rect x="0" y="0" width={FRETBOARD_WIDTH} height={FRETBOARD_HEIGHT} fill="#6B462A" />

        {/* フレット */}
        {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
          <g key={`fret-${i}`}>
            <line
              x1={i * FRET_WIDTH + FRET_WIDTH / 2}
              y1="10"
              x2={i * FRET_WIDTH + FRET_WIDTH / 2}
              y2={FRETBOARD_HEIGHT - 10}
              stroke={i === 0 ? "#DDD" : "#AAA"}
              strokeWidth={i === 0 ? 8 : 4}
            />
            {i > 0 && 
              <text x={i * FRET_WIDTH} y={FRETBOARD_HEIGHT - 2} textAnchor="middle" fill="#CCC" fontSize="10">{i}</text>
            }
          </g>
        ))}

        {/* ポジションマーク */}
        {INLAY_FRETS.map(fret => (
            fret === 12 || fret === 24 ? (
                <g key={`inlay-${fret}`}>
                    <circle cx={(fret - 1) * FRET_WIDTH + FRET_WIDTH} cy={FRETBOARD_HEIGHT / 2 - STRING_SPACING} r="6" fill="#E0E0E0" opacity="0.7" />
                    <circle cx={(fret - 1) * FRET_WIDTH + FRET_WIDTH} cy={FRETBOARD_HEIGHT / 2 + STRING_SPACING} r="6" fill="#E0E0E0" opacity="0.7" />
                </g>
            ) : (
                <circle key={`inlay-${fret}`} cx={(fret - 1) * FRET_WIDTH + FRET_WIDTH} cy={FRETBOARD_HEIGHT / 2} r="6" fill="#E0E0E0" opacity="0.7" />
            )
        ))}


        {/* 弦とクリック領域 */}
        {OPEN_STRINGS.map((_, stringIndex) => (
          <g key={`string-group-${stringIndex}`}>
            <line
              x1="0"
              y1={10 + stringIndex * STRING_SPACING}
              x2={FRETBOARD_WIDTH}
              y2={10 + stringIndex * STRING_SPACING}
              stroke="#555"
              strokeWidth={1 + stringIndex * 0.5} // 低音弦を太く
            />
             {Array.from({ length: NUM_FRETS + 1 }).map((_, fretIndex) => (
                <rect
                    key={`clickable-${stringIndex}-${fretIndex}`}
                    x={fretIndex * FRET_WIDTH}
                    y={stringIndex * STRING_SPACING}
                    width={FRET_WIDTH}
                    height={STRING_SPACING}
                    fill="transparent"
                    className="cursor-pointer hover:fill-cyan-500/30 active:fill-cyan-500/50"
                    onClick={() => handleFretClick(stringIndex, fretIndex)}
                />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
};