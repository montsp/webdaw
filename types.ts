
export interface Note {
  id: string;
  pitch: string; // e.g., 'C4'
  startBeat: number;
  duration: number; // in beats
}

export type DrumInstrument = 'kick' | 'snare' | 'hihat' | 'clap';
export type SynthInstrumentType = 'sawtooth' | 'square' | 'sine' | 'triangle' | 'piano' | 'bass' | 'guitar';
export type InstrumentType = DrumInstrument | SynthInstrumentType;

export type DrumPatternGrid = boolean[][];

export interface DrumPattern {
  sounds: DrumInstrument[];
  grid: DrumPatternGrid;
}

interface BaseTrack {
  id: string;
  name: string;
  volume: number; // 0-1
  muted?: boolean;
  soloed?: boolean;
}

export interface DrumTrack extends BaseTrack {
  type: 'drum';
  pattern: DrumPattern;
}

export interface SynthTrack extends BaseTrack {
  type: 'synth';
  instrument: SynthInstrumentType;
  notes: Note[];
}

export type TrackType = DrumTrack | SynthTrack;

export interface SessionData {
  bpm: number;
  bars: number;
  tracks: TrackType[];
  loopStartBar: number;
  loopEndBar: number;
}