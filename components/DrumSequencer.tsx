import React from 'react';
import type { DrumPattern } from '../types';

interface DrumSequencerProps {
  pattern: DrumPattern;
  bars: number;
  currentStep: number;
  isPlaying: boolean;
  onPatternChange: (newGrid: boolean[][]) => void;
}

export const DrumSequencer: React.FC<DrumSequencerProps> = ({ pattern, bars, currentStep, isPlaying, onPatternChange }) => {
  const steps = bars * 16;

  const handleStepClick = (soundIndex: number, stepIndex: number) => {
    const newGrid = pattern.grid.map(row => [...row]);
    newGrid[soundIndex][stepIndex] = !newGrid[soundIndex][stepIndex];
    onPatternChange(newGrid);
  };

  return (
    <div className="relative h-full">
      <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${steps}, 2.5rem)` }}>
        {pattern.grid.map((row, soundIndex) => (
          <React.Fragment key={soundIndex}>
            {row.map((isActive, stepIndex) => {
              const isBeat = stepIndex % 4 === 0;
              return (
                <div
                  key={`${soundIndex}-${stepIndex}`}
                  onClick={() => handleStepClick(soundIndex, stepIndex)}
                  className={`h-10 w-10 border-b border-r cursor-pointer transition-colors
                    ${isActive ? 'bg-cyan-500' : (isBeat ? 'bg-gray-800' : 'bg-gray-800/70')}
                    ${isBeat ? 'border-l-gray-600' : 'border-l-gray-700'}
                  `}
                />
              );
            })}
          </React.Fragment>
        ))}
        </div>
        {isPlaying && (
        <div
            className="absolute top-0 bottom-0 w-1 bg-red-500/70 pointer-events-none"
            style={{ left: `${currentStep * 2.5}rem` }}
        />
        )}
    </div>
  );
};
