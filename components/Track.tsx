
import React from 'react';
import type { TrackType, Note, DrumPatternGrid, SynthInstrumentType } from '../types.ts';
import { TrashIcon } from './icons.tsx';
import { PIANO_ROLL_NOTES, JAPANESE_INSTRUMENT_NAMES } from '../constants.ts';

interface TrackProps {
  trackData: TrackType;
  currentStep: number;
  isPlaying: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateTrack: (updatedProps: Partial<TrackType>) => void;
  onDeleteTrack: () => void;
  totalSteps: number;
  stepWidthPx: number;
}

const Clip: React.FC<{trackData: TrackType, totalSteps: number, stepWidthPx: number}> = ({ trackData, totalSteps, stepWidthPx }) => {
    const width = totalSteps * stepWidthPx;

    const renderGrid = () => {
        return Array.from({ length: totalSteps }).map((_, i) => {
            const isBeat = i % 4 === 0;
            const isBar = i % 16 === 0;
            return (
                <div 
                    key={i} 
                    className={`h-full ${isBar ? 'border-l-gray-600' : isBeat ? 'border-l-gray-700' : 'border-l-gray-800'}`} 
                    style={{width: `${stepWidthPx}px`, borderLeftWidth: '1px'}}
                />
            )
        })
    }

    const renderSynthNotes = (notes: Note[]) => {
        const noteRange = PIANO_ROLL_NOTES.length;
        return notes.map((note, i) => {
            const noteIndex = PIANO_ROLL_NOTES.indexOf(note.pitch);
            const yPos = (1 - (noteIndex / noteRange)) * 100;
            return (
                <div 
                    key={i}
                    className="absolute bg-cyan-500 rounded-sm"
                    style={{
                        left: `${note.startBeat * 4 * stepWidthPx}px`,
                        width: `${note.duration * 4 * stepWidthPx}px`,
                        top: `${yPos}%`,
                        height: '4px',
                        transform: 'translateY(-50%)',
                    }}
                />
            )
        })
    }
    
    const renderDrumHits = (grid: DrumPatternGrid) => {
        const numSounds = grid.length;
        return grid.flatMap((row, soundIndex) => (
            row.map((isActive, stepIndex) => {
                if (!isActive) return null;
                const yPos = (soundIndex / numSounds) * 100 + (100 / (numSounds*2));
                return (
                     <div 
                        key={`${soundIndex}-${stepIndex}`}
                        className="absolute bg-cyan-500 rounded-full"
                        style={{
                            left: `${stepIndex * stepWidthPx + stepWidthPx/2 - 2}px`,
                            top: `${yPos}%`,
                            width: '4px',
                            height: '4px',
                            transform: 'translateY(-50%)',
                        }}
                    />
                )
            })
        ))
    }

    return (
        <div className="relative h-full bg-gray-800/50 clip-container" style={{ width: `${width}px` }}>
            <div className="absolute inset-0 flex">{renderGrid()}</div>
            <div className="absolute inset-0">
                {trackData.type === 'synth' && renderSynthNotes(trackData.notes)}
                {trackData.type === 'drum' && renderDrumHits(trackData.pattern.grid)}
            </div>
        </div>
    )
}


export const Track: React.FC<TrackProps> = ({ trackData, currentStep, isPlaying, isSelected, onSelect, onUpdateTrack, onDeleteTrack, totalSteps, stepWidthPx }) => {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateTrack({ volume: parseFloat(e.target.value) });
  };

  const toggleMute = () => {
    onUpdateTrack({ muted: !trackData.muted });
  };

  const toggleSolo = () => {
    onUpdateTrack({ soloed: !trackData.soloed });
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateTrack({ name: e.target.value });
  };
  
  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent onSelect from firing when deleting
      onDeleteTrack();
  }

  return (
    <div 
        className={`flex items-stretch border-b border-gray-800 cursor-pointer ${isSelected ? 'bg-gray-700/50' : 'hover:bg-gray-800/50'}`}
        onClick={onSelect}
    >
      {/* Track Controls */}
      <div className={`w-48 flex-shrink-0 bg-gray-800 p-3 flex flex-col space-y-3 border-r ${isSelected ? 'border-cyan-500' : 'border-gray-700'} sticky left-0 z-10`}>
        <input
          type="text"
          value={trackData.name}
          onClick={e => e.stopPropagation()}
          onChange={handleNameChange}
          className="bg-gray-700 text-white font-semibold w-full text-center rounded p-1 border-transparent focus:border-cyan-500 focus:ring-0"
        />
         {trackData.type === 'synth' && (
            <div className="flex items-center space-x-2">
                <label htmlFor={`instrument-${trackData.id}`} className="text-xs text-gray-400 flex-shrink-0">音色</label>
                <select
                    id={`instrument-${trackData.id}`}
                    value={trackData.instrument}
                    onClick={e => e.stopPropagation()}
                    onChange={(e) => onUpdateTrack({ instrument: e.target.value as SynthInstrumentType })}
                    className="w-full bg-gray-600 text-white text-xs rounded p-1 border-transparent focus:border-cyan-500 focus:ring-0 appearance-none text-center"
                    style={{ textOverflow: 'ellipsis' }}
                >
                    {Object.entries(JAPANESE_INSTRUMENT_NAMES).map(([key, name]) => (
                        <option key={key} value={key}>{name}</option>
                    ))}
                </select>
            </div>
        )}
        <div className="flex items-center space-x-2">
            <label htmlFor={`volume-${trackData.id}`} className="text-xs text-gray-400">音量</label>
            <input
                id={`volume-${trackData.id}`}
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={trackData.volume}
                onClick={e => e.stopPropagation()}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
        </div>
        <div className="flex items-center justify-around">
            <button 
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${trackData.muted ? 'bg-yellow-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                aria-label={trackData.muted ? "ミュート解除" : "ミュート"}
            >
                M
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); toggleSolo(); }}
                className={`w-8 h-8 flex items-center justify-center font-bold text-sm rounded-full transition-colors ${trackData.soloed ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                aria-label={trackData.soloed ? "ソロ解除" : "ソロ"}
            >
                S
            </button>
            <button 
                onClick={handleDelete}
                className="p-2 rounded-full bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors"
                aria-label="トラックを削除"
            >
                <TrashIcon />
            </button>
        </div>
      </div>
      
      {/* Clip Section */}
      <div className="flex-grow relative">
          <Clip trackData={trackData} totalSteps={totalSteps} stepWidthPx={stepWidthPx} />
      </div>
    </div>
  );
};