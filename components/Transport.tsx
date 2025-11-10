
import React from 'react';
import { PlayIcon, StopIcon } from './icons.tsx';

interface TransportProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  bars: number;
  onBarsChange: (bars: number) => void;
}

export const Transport: React.FC<TransportProps> = ({ isPlaying, onPlay, onStop, bpm, onBpmChange, bars, onBarsChange }) => {
  return (
    <div className="bg-gray-900 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6 shadow-md">
      <div className="flex items-center space-x-2">
        <button
          onClick={onPlay}
          disabled={isPlaying}
          className="bg-gray-800 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed p-3 rounded-full text-white transition-colors duration-200"
          aria-label="再生"
        >
          <PlayIcon />
        </button>
        <button
          onClick={onStop}
          disabled={!isPlaying}
          className="bg-gray-800 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed p-3 rounded-full text-white transition-colors duration-200"
          aria-label="停止"
        >
          <StopIcon />
        </button>
      </div>
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <label htmlFor="bpm" className="font-medium text-gray-400">BPM</label>
        <input
          type="range"
          id="bpm"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-full sm:w-48 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <input
          type="number"
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="bg-gray-800 text-white w-20 text-center rounded-md p-1 border-gray-700 border"
        />
      </div>
       <div className="flex items-center space-x-3 w-full sm:w-auto">
        <label htmlFor="bars" className="font-medium text-gray-400">小節数</label>
        <input
          type="number"
          id="bars"
          min="1"
          max="128"
          value={bars}
          onChange={(e) => onBarsChange(Number(e.target.value))}
          className="bg-gray-800 text-white w-20 text-center rounded-md p-1 border-gray-700 border"
        />
      </div>
    </div>
  );
};