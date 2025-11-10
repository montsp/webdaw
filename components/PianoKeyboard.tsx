
import React from 'react';
import { PIANO_ROLL_NOTES } from '../constants';

interface PianoKeyboardProps {
  playNotePreview: (pitch: string) => void;
}

const WHITE_KEY_WIDTH = 24;
const WHITE_KEY_HEIGHT = 120;
const BLACK_KEY_WIDTH = 14;
const BLACK_KEY_HEIGHT = 80;

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ playNotePreview }) => {
  const notes = PIANO_ROLL_NOTES.slice().reverse(); // A0からC8へ

  let whiteKeyX = 0;
  const keyElements = notes.map((note) => {
    const isBlack = note.includes('#');
    if (isBlack) {
      const prevWhiteKeyX = whiteKeyX - WHITE_KEY_WIDTH;
      return {
        note,
        isBlack,
        x: prevWhiteKeyX + WHITE_KEY_WIDTH - (BLACK_KEY_WIDTH / 2),
        y: 0,
        width: BLACK_KEY_WIDTH,
        height: BLACK_KEY_HEIGHT,
      };
    } else {
      const key = {
        note,
        isBlack,
        x: whiteKeyX,
        y: 0,
        width: WHITE_KEY_WIDTH,
        height: WHITE_KEY_HEIGHT,
      };
      whiteKeyX += WHITE_KEY_WIDTH;
      return key;
    }
  });

  const totalWidth = whiteKeyX;

  const whiteKeys = keyElements.filter(k => !k.isBlack);
  const blackKeys = keyElements.filter(k => k.isBlack);

  return (
    <div className="overflow-x-auto bg-gray-900 h-32 flex-shrink-0 border-t-2 border-gray-700 select-none">
      <svg width={totalWidth} height={WHITE_KEY_HEIGHT} className="h-full">
        <g>
          {whiteKeys.map(({ note, x, y, width, height }) => (
            <rect
              key={note}
              x={x}
              y={y}
              width={width}
              height={height}
              fill="white"
              stroke="black"
              strokeWidth="1"
              className="cursor-pointer active:fill-cyan-300"
              onPointerDown={() => playNotePreview(note)}
            />
          ))}
        </g>
        <g>
          {blackKeys.map(({ note, x, y, width, height }) => (
            <rect
              key={note}
              x={x}
              y={y}
              width={width}
              height={height}
              fill="black"
              stroke="black"
              strokeWidth="1"
              className="cursor-pointer active:fill-gray-600"
              onPointerDown={(e) => {
                e.stopPropagation();
                playNotePreview(note);
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
