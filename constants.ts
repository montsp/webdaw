
import type { SessionData, DrumInstrument, SynthInstrumentType } from './types';

const generatePianoRollData = () => {
    const notes: string[] = [];
    const japaneseNames: { [key: string]: string } = {};
    const noteBases = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    const japaneseNoteBases: { [key: string]: string } = {
        'A': 'ラ', 'A#': 'ラ#', 'B': 'シ', 'C': 'ド', 'C#': 'ド#', 'D': 'レ', 'D#': 'レ#', 'E': 'ミ', 'F': 'ファ', 'F#': 'ファ#', 'G': 'ソ', 'G#': 'ソ#',
    };

    // 88鍵（A0からC8まで）を生成
    for (let i = 0; i < 88; i++) {
        const octave = Math.floor((i + 9) / 12);
        const noteIndex = (i + 9) % 12;
        const noteBase = noteBases[noteIndex];
        const note = `${noteBase}${octave}`;
        notes.push(note);
        japaneseNames[note] = `${japaneseNoteBases[noteBase]}${octave}`;
    }
    
    // UI表示のため、高音（上）から低音（下）の順に並び替える
    return {
        notes: notes.reverse(),
        japaneseNames
    };
};

const pianoRollData = generatePianoRollData();

export const PIANO_ROLL_NOTES = pianoRollData.notes;
export const JAPANESE_NOTE_NAMES = pianoRollData.japaneseNames;

export const JAPANESE_DRUM_NAMES: { [key in DrumInstrument]: string } = {
    kick: 'キック',
    snare: 'スネア',
    hihat: 'ハイハット',
    clap: 'クラップ'
};

export const JAPANESE_INSTRUMENT_NAMES: { [key in SynthInstrumentType]: string } = {
    sawtooth: 'ノコギリ波シンセ',
    square: '矩形波シンセ',
    sine: 'サイン波シンセ',
    triangle: '三角波シンセ',
    piano: 'グランドピアノ',
    bass: 'ベースシンセ',
    guitar: 'アコースティックギター',
};


const DRUM_SOUNDS: DrumInstrument[] = ['kick', 'snare', 'hihat', 'clap'];
const BARS = 4;
const STEPS_PER_BAR = 16;
const TOTAL_STEPS = BARS * STEPS_PER_BAR;

const oneBarKick = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
const oneBarSnare = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
const oneBarHihat = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
const oneBarClap = [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true];

export const DEFAULT_SESSION_DATA: SessionData = {
  bpm: 120,
  bars: BARS,
  loopStartBar: 1,
  loopEndBar: BARS,
  tracks: [
    {
      id: 'track-synth-1',
      type: 'synth',
      name: 'メロディーシンセ',
      instrument: 'sawtooth',
      volume: 0.8,
      muted: false,
      soloed: false,
      notes: [
        { id: 'default-note-1', pitch: 'C4', startBeat: 0, duration: 0.25 },
        { id: 'default-note-2', pitch: 'D4', startBeat: 1, duration: 0.25 },
        { id: 'default-note-3', pitch: 'E4', startBeat: 2, duration: 0.25 },
        { id: 'default-note-4', pitch: 'F4', startBeat: 3, duration: 0.25 },
        { id: 'default-note-5', pitch: 'G4', startBeat: 4, duration: 0.25 },
        { id: 'default-note-6', pitch: 'A4', startBeat: 5, duration: 0.25 },
        { id: 'default-note-7', pitch: 'B4', startBeat: 6, duration: 0.25 },
        { id: 'default-note-8', pitch: 'C5', startBeat: 7, duration: 0.25 },
      ]
    },
    {
      id: 'track-drum-1',
      type: 'drum',
      name: 'ドラムキット',
      volume: 1.0,
      muted: false,
      soloed: false,
      pattern: {
        sounds: DRUM_SOUNDS,
        grid: [
          // Kick
          [...oneBarKick, ...oneBarKick, ...oneBarKick, ...oneBarKick],
          // Snare
          [...oneBarSnare, ...oneBarSnare, ...oneBarSnare, ...oneBarSnare],
          // Hi-hat
          [...oneBarHihat, ...oneBarHihat, ...oneBarHihat, ...oneBarHihat],
          // Clap
          [...oneBarClap, ...oneBarClap, ...oneBarClap, ...oneBarClap],
        ],
      },
    }
  ],
};