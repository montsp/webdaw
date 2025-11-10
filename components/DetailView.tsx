
import React, { useState } from 'react';
import type { TrackType, Note, DrumPatternGrid } from '../types';
import { PianoRoll } from './PianoRoll';
import { DrumSequencer } from './DrumSequencer';
import { JAPANESE_DRUM_NAMES, PIANO_ROLL_NOTES, JAPANESE_NOTE_NAMES } from '../constants';
import { PianoKeyboard } from './PianoKeyboard';
import { GuitarFretboard } from './GuitarFretboard';

interface DetailViewProps {
  trackData: TrackType;
  currentStep: number;
  isPlaying: boolean;
  onUpdatePatternOrNotes: (newData: DrumPatternGrid | Note[]) => void;
  bars: number;
  containerRef: React.RefObject<HTMLDivElement>;
  playNotePreview: (pitch: string) => void;
  playDrumPreview: (soundIndex: number) => void;
}

type EditorView = 'pianoroll' | 'keyboard' | 'guitar' | 'drum_sequencer';

const getInitialView = (track: TrackType): EditorView => {
  if (track.type === 'drum') return 'drum_sequencer';
  return 'pianoroll';
};

export const DetailView: React.FC<DetailViewProps> = ({ trackData, currentStep, isPlaying, onUpdatePatternOrNotes, bars, containerRef, playNotePreview, playDrumPreview }) => {
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<EditorView>(() => getInitialView(trackData));

  const isSynthTrack = trackData.type === 'synth';
  const isDrumTrack = trackData.type === 'drum';
  const isGuitarTrack = isSynthTrack && trackData.instrument === 'guitar';

  const renderViewToggle = () => {
    if (!isSynthTrack) return null;

    const commonButtonClass = "px-3 py-1 text-sm font-semibold rounded-md transition-colors";
    const activeButtonClass = "bg-cyan-500 text-white";
    const inactiveButtonClass = "bg-gray-700 hover:bg-gray-600 text-gray-300";

    const pianoRollButton = (
      <button 
        onClick={() => setView('pianoroll')}
        className={`${commonButtonClass} ${view === 'pianoroll' ? activeButtonClass : inactiveButtonClass}`}
      >
        ピアノロール
      </button>
    );

    const instrumentButton = isGuitarTrack ? (
      <button 
        onClick={() => setView('guitar')}
        className={`${commonButtonClass} ${view === 'guitar' ? activeButtonClass : inactiveButtonClass}`}
      >
        ギター
      </button>
    ) : (
      <button 
        onClick={() => setView('keyboard')}
        className={`${commonButtonClass} ${view === 'keyboard' ? activeButtonClass : inactiveButtonClass}`}
      >
        鍵盤
      </button>
    );

    return (
      <div className="flex items-center space-x-2 p-1 bg-gray-800 rounded-lg">
        {pianoRollButton}
        {instrumentButton}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="flex-shrink-0 bg-gray-900 p-2 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="font-semibold text-white">MIDIエディター: <span className="text-cyan-400">{trackData.name}</span></h2>
          {renderViewToggle()}
        </div>
        
        {isSynthTrack && view === 'pianoroll' && (
            <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">ズーム</span>
            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-center">-</button>
            <input
                type="range"
                min="0.25"
                max="4"
                step="0.25"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                aria-label="ズームレベル"
            />
            <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-center">+</button>
            </div>
        )}
      </header>
      
      <div className="flex-grow flex flex-col min-h-0">
        {/* PIANO ROLL VIEW */}
        {view === 'pianoroll' && isSynthTrack && (
          <div className="flex-grow overflow-auto" ref={containerRef}>
            <div className="flex relative">
                <div className="flex-shrink-0 bg-gray-800 sticky left-0 z-10">
                    {PIANO_ROLL_NOTES.map(note => {
                        const isBlack = note.includes('#');
                        return (
                            <button
                                key={note}
                                onClick={() => playNotePreview(note)}
                                className={`w-24 flex items-center justify-center border-b border-r border-gray-600 text-xs font-mono transition-colors ${
                                isBlack
                                    ? 'bg-gray-600 text-white hover:bg-gray-500'
                                    : 'bg-gray-300 text-black hover:bg-gray-400'
                                }`}
                                style={{ height: '1.5rem' }}
                            >
                                {JAPANESE_NOTE_NAMES[note] || note}
                            </button>
                        );
                    })}
                </div>
                <div className="flex-grow">
                  <PianoRoll
                    notes={trackData.notes}
                    bars={bars}
                    currentStep={currentStep}
                    isPlaying={isPlaying}
                    onNotesChange={(newNotes) => onUpdatePatternOrNotes(newNotes)}
                    zoom={zoom}
                  />
                </div>
            </div>
          </div>
        )}

        {/* KEYBOARD VIEW */}
        {view === 'keyboard' && isSynthTrack && (
          <div className="flex-grow flex items-center justify-center bg-gray-900/50">
            <PianoKeyboard playNotePreview={playNotePreview} />
          </div>
        )}

        {/* GUITAR VIEW */}
        {view === 'guitar' && isGuitarTrack && (
          <div className="flex-grow flex items-center justify-center bg-gray-900/50">
            <GuitarFretboard playNotePreview={playNotePreview} />
          </div>
        )}

        {/* DRUM SEQUENCER VIEW */}
        {isDrumTrack && ( // Drum track has only one view
          <div className="flex-grow overflow-auto" ref={containerRef}>
            <div className="flex relative">
                <div className="flex-shrink-0 bg-gray-800 sticky left-0 z-10">
                  <div>
                    {trackData.pattern.sounds.map((sound, index) => (
                      <button 
                          key={sound}
                          onClick={() => playDrumPreview(index)}
                          className="h-10 w-24 flex items-center justify-center bg-gray-700 hover:bg-gray-600 border-b border-r border-gray-600 text-sm font-semibold capitalize transition-colors"
                      >
                        {JAPANESE_DRUM_NAMES[sound] || sound}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-grow">
                  <DrumSequencer
                    pattern={trackData.pattern}
                    bars={bars}
                    currentStep={currentStep}
                    isPlaying={isPlaying}
                    onPatternChange={(newGrid) => onUpdatePatternOrNotes(newGrid)}
                  />
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
