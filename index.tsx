
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- BUNDLED TYPES (from types.ts) ---
interface Note {
  id: string;
  pitch: string; // e.g., 'C4'
  startBeat: number;
  duration: number; // in beats
}

type DrumInstrument = 'kick' | 'snare' | 'hihat' | 'clap';
type SynthInstrumentType = 'sawtooth' | 'square' | 'sine' | 'triangle' | 'piano' | 'bass' | 'guitar';
type InstrumentType = DrumInstrument | SynthInstrumentType;

type DrumPatternGrid = boolean[][];

interface DrumPattern {
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

interface DrumTrack extends BaseTrack {
  type: 'drum';
  pattern: DrumPattern;
}

interface SynthTrack extends BaseTrack {
  type: 'synth';
  instrument: SynthInstrumentType;
  notes: Note[];
}

type TrackType = DrumTrack | SynthTrack;

interface SessionData {
  bpm: number;
  bars: number;
  tracks: TrackType[];
  loopStartBar: number;
  loopEndBar: number;
}


// --- BUNDLED ICONS (from components/icons.tsx) ---
const PlayIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const StopIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
  </svg>
);

const HelpIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
  
const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

// --- BUNDLED CONSTANTS (from constants.ts) ---
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
const PIANO_ROLL_NOTES = pianoRollData.notes;
const JAPANESE_NOTE_NAMES = pianoRollData.japaneseNames;

const JAPANESE_DRUM_NAMES: { [key in DrumInstrument]: string } = {
    kick: 'キック',
    snare: 'スネア',
    hihat: 'ハイハット',
    clap: 'クラップ'
};

const JAPANESE_INSTRUMENT_NAMES: { [key in SynthInstrumentType]: string } = {
    sawtooth: 'ノコギリ波シンセ',
    square: '矩形波シンセ',
    sine: 'サイン波シンセ',
    triangle: '三角波シンセ',
    piano: 'グランドピアノ',
    bass: 'ベースシンセ',
    guitar: 'アコースティックギター',
};

const DRUM_SOUNDS: DrumInstrument[] = ['kick', 'snare', 'hihat', 'clap'];
const BARS_DEFAULT = 4;
const STEPS_PER_BAR = 16;
const TOTAL_STEPS_DEFAULT = BARS_DEFAULT * STEPS_PER_BAR;

const oneBarKick = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
const oneBarSnare = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
const oneBarHihat = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];
const oneBarClap = [false, false, false, false, true, false, false, true, false, false, false, false, true, false, false, true];

const DEFAULT_SESSION_DATA: SessionData = {
  bpm: 120,
  bars: BARS_DEFAULT,
  loopStartBar: 1,
  loopEndBar: BARS_DEFAULT,
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
          [...oneBarKick, ...oneBarKick, ...oneBarKick, ...oneBarKick],
          [...oneBarSnare, ...oneBarSnare, ...oneBarSnare, ...oneBarSnare],
          [...oneBarHihat, ...oneBarHihat, ...oneBarHihat, ...oneBarHihat],
          [...oneBarClap, ...oneBarClap, ...oneBarClap, ...oneBarClap],
        ],
      },
    }
  ],
};


// --- BUNDLED UTILS (from utils/dataEncoder.ts) ---
declare const pako: any;

function encodeSessionData(sessionData: SessionData): string {
  try {
    const jsonString = JSON.stringify(sessionData);
    const compressed = pako.deflate(jsonString, { to: 'string' });
    const base64 = btoa(compressed);
    const urlSafeBase64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const url = new URL(window.location.href);
    url.search = `?data=${urlSafeBase64}`;
    return url.toString();
  } catch (error) {
    console.error("Failed to encode session data:", error);
    return "";
  }
}

function decodeSessionData(encodedData: string): SessionData | null {
  try {
    const urlSafeBase64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
    const base64 = atob(urlSafeBase64);
    const decompressed = pako.inflate(base64, { to: 'string' });
    return JSON.parse(decompressed) as SessionData;
  } catch (error) {
    console.error("Failed to decode session data:", error);
    return null;
  }
}


// --- BUNDLED AUDIO (from audio/AudioEngine.ts) ---
const createKick = (ctx: AudioContext, time: number, destination: AudioNode) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + 0.15);
};

const createSnare = (ctx: AudioContext, time: number, destination: AudioNode) => {
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    noise.connect(filter);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    filter.connect(gain);
    gain.connect(destination);
    noise.start(time);
    noise.stop(time + 0.2);
};

const createHihat = (ctx: AudioContext, time: number, destination: AudioNode) => {
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    noise.connect(filter);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    filter.connect(gain);
    gain.connect(destination);
    noise.start(time);
    noise.stop(time + 0.1);
};

const createClap = (ctx: AudioContext, time: number, destination: AudioNode) => {
    const gain = ctx.createGain();
    for(let i = 0; i < 3; i++) {
        const noise = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < data.length; j++) {
            data[j] = Math.random() * 2 - 1;
        }
        noise.buffer = buffer;
        const delayTime = i * 0.005;
        noise.start(time + delayTime);
        noise.stop(time + delayTime + 0.1);
        noise.connect(gain);
    }
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200;
    gain.connect(filter);
    const finalGain = ctx.createGain();
    finalGain.gain.setValueAtTime(0.7, time);
    finalGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    filter.connect(finalGain);
    finalGain.connect(destination);
};

const generateFrequencies = (): { [key: string]: number } => {
    const frequencies: { [key: string]: number } = {};
    const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
    const a4 = 440;

    for (let i = 0; i < 88; i++) {
        const noteName = noteNames[(i + 9) % 12];
        const octave = Math.floor((i + 9) / 12);
        const note = `${noteName}${octave}`;
        const keyNumber = i - 48;
        const frequency = a4 * Math.pow(2, keyNumber / 12);
        frequencies[note] = frequency;
    }
    return frequencies;
};

const NOTE_FREQUENCIES = generateFrequencies();

class AudioEngine {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private drumSamples: { [key in DrumInstrument]: (ctx: AudioContext, time: number, destination: AudioNode) => void };

    constructor() {
        this.drumSamples = { kick: createKick, snare: createSnare, hihat: createHihat, clap: createClap };
    }

    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }
    
    start() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    stop() {}

    getCurrentTime(): number {
        return this.audioContext?.currentTime || 0;
    }

    playDrum(instrument: DrumInstrument, time: number, volume: number) {
        if (!this.audioContext || !this.masterGain) return;
        const drumGain = this.audioContext.createGain();
        drumGain.gain.setValueAtTime(volume, time);
        drumGain.connect(this.masterGain);
        this.drumSamples[instrument](this.audioContext, time, drumGain);
    }

    playSynth(pitch: string, time: number, duration: number, volume: number, instrument: SynthInstrumentType) {
        if (!this.audioContext || !this.masterGain) return;
        const freq = NOTE_FREQUENCIES[pitch];
        if (!freq) return;
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGain);
        switch (instrument) {
            case 'piano': {
                const fundamental = this.audioContext.createOscillator();
                fundamental.type = 'triangle';
                fundamental.frequency.setValueAtTime(freq, time);
                const harmonic = this.audioContext.createOscillator();
                harmonic.type = 'sawtooth';
                harmonic.frequency.setValueAtTime(freq * 2, time);
                const harmonicGain = this.audioContext.createGain();
                harmonicGain.gain.value = 0.3;
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(5000, time);
                filter.Q.setValueAtTime(1, time);
                fundamental.connect(filter);
                harmonic.connect(harmonicGain);
                harmonicGain.connect(filter);
                filter.connect(gainNode);
                const attackTime = 0.01;
                const decayTime = 0.2;
                const sustainLevel = 0.6;
                const releaseTime = 0.5;
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(volume, time + attackTime);
                gainNode.gain.exponentialRampToValueAtTime(volume * sustainLevel, time + attackTime + decayTime);
                gainNode.gain.setValueAtTime(gainNode.gain.value, time + duration);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration + releaseTime);
                fundamental.start(time);
                fundamental.stop(time + duration + releaseTime);
                harmonic.start(time);
                harmonic.stop(time + duration + releaseTime);
                return;
            }
            case 'guitar': {
                const fundamentalFreq = freq;
                const decay = 0.996;
                const delayTime = 1.0 / fundamentalFreq;
                if (delayTime > 1.0) return;
                const noise = this.audioContext.createBufferSource();
                const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.05, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 2500;
                filter.Q.value = 1;
                const delayNode = this.audioContext.createDelay(delayTime);
                delayNode.delayTime.value = delayTime;
                const feedbackGain = this.audioContext.createGain();
                feedbackGain.gain.value = decay;
                noise.connect(filter);
                filter.connect(delayNode);
                delayNode.connect(feedbackGain);
                feedbackGain.connect(filter);
                delayNode.connect(gainNode);
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(volume * 0.9, time + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration + 1.5);
                noise.start(time);
                noise.stop(time + 0.05);
                const stopTime = time + duration + 1.6;
                setTimeout(() => {
                    try {
                        filter.disconnect();
                        delayNode.disconnect();
                        feedbackGain.disconnect();
                    } catch(e) {}
                }, (stopTime - this.audioContext.currentTime) * 1000 + 100);
                return;
            }
            case 'bass':
                const bassOsc = this.audioContext.createOscillator();
                bassOsc.type = 'square';
                bassOsc.frequency.setValueAtTime(freq / 2, time);
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(400, time);
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(volume * 0.9, time + 0.01);
                gainNode.gain.linearRampToValueAtTime(0, time + duration);
                bassOsc.connect(filter);
                filter.connect(gainNode);
                bassOsc.start(time);
                bassOsc.stop(time + duration);
                return;
            case 'sawtooth':
            case 'square':
            case 'sine':
            case 'triangle':
            default:
                const osc = this.audioContext.createOscillator();
                osc.type = instrument;
                osc.frequency.setValueAtTime(freq, time);
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(0.5 * volume, time + 0.01);
                gainNode.gain.linearRampToValueAtTime(0, time + duration);
                osc.connect(gainNode);
                osc.start(time);
                osc.stop(time + duration);
                break;
        }
    }
}


// --- BUNDLED COMPONENTS ---

const HelpTooltip: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white"
      >
        <HelpIcon />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-50">
          <h3 className="font-bold text-white mb-2">使い方</h3>
          <p className="text-sm text-gray-300">
            これはサーバーレスのDAWです。あなたの音楽はすべてURLに保存されます。
            「プロジェクトを共有」ボタンをクリックして、あなたの作品へのユニークなリンクを取得してください。
            すべてがブラウザで、無料で、永遠に実行されます。
          </p>
        </div>
      )}
    </div>
  );
};

const ShareModal: React.FC<{ url: string; onClose: () => void; }> = ({ url, onClose }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess('コピーしました！');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('コピーに失敗しました。');
    }
  };
  useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
         if (event.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-white">作品を共有</h2>
        <p className="text-gray-400 mb-4">
          このURLをコピーしてプロジェクトを共有します。すべての音楽データはリンクに直接保存されます！
        </p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input type="text" readOnly value={url} className="w-full bg-gray-900 text-gray-300 border border-gray-700 rounded-md p-2 text-sm" />
          <button onClick={copyToClipboard} className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 w-full sm:w-auto">
            {copySuccess || 'URLをコピー'}
          </button>
        </div>
        <button onClick={onClose} className="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md w-full">
          閉じる
        </button>
      </div>
    </div>
  );
};

const DeployModal: React.FC<{ sessionData: SessionData; onClose: () => void; }> = ({ sessionData, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const handleGenerateAndDownload = async () => {
    setStatus('generating');
    setErrorMessage('');
    try {
      const response = await fetch(window.location.origin + '/index.html');
      if (!response.ok) throw new Error(`HTMLの取得に失敗しました: ${response.statusText}`);
      let htmlContent = await response.text();
      const injectedScript = `<script>window.INITIAL_SESSION_DATA = ${JSON.stringify(sessionData)};</script>`;
      htmlContent = htmlContent.replace('</head>', `  ${injectedScript}\n  </head>`);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      console.error('デプロイ用HTMLの生成に失敗しました:', error);
      setErrorMessage(error.message || '不明なエラーが発生しました。');
      setStatus('error');
    }
  };
  useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
         if (event.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);
  const getButtonText = () => {
    switch (status) {
      case 'generating': return '生成中...';
      case 'success': return 'ダウンロードしました！';
      case 'error': return '再試行';
      default: return 'HTMLを生成＆ダウンロード';
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-white">GitHub Pagesにデプロイ</h2>
        <div className="text-gray-400 mb-4 space-y-3">
            <p>この機能は、プロジェクト全体を自己完結型の単一<code className="bg-gray-900 text-cyan-400 px-1 py-0.5 rounded text-sm">index.html</code>ファイルとして生成します。</p>
            <p>ダウンロードしたファイルをGitHubリポジトリにアップロードし、<a href="https://docs.github.com/ja/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">GitHub Pagesを有効化</a>することで、あなたの音楽をウェブサイトとして公開できます。</p>
        </div>
        <button onClick={handleGenerateAndDownload} disabled={status === 'generating' || status === 'success'} className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition duration-200 w-full">
          {getButtonText()}
        </button>
        {status === 'error' && <p className="text-red-400 mt-2 text-sm">{errorMessage}</p>}
        <button onClick={onClose} className="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md w-full">
          閉じる
        </button>
      </div>
    </div>
  );
};

const Transport: React.FC<{ isPlaying: boolean; onPlay: () => void; onStop: () => void; bpm: number; onBpmChange: (bpm: number) => void; bars: number; onBarsChange: (bars: number) => void; }> = ({ isPlaying, onPlay, onStop, bpm, onBpmChange, bars, onBarsChange }) => (
    <div className="bg-gray-900 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6 shadow-md">
      <div className="flex items-center space-x-2">
        <button onClick={onPlay} disabled={isPlaying} className="bg-gray-800 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed p-3 rounded-full text-white transition-colors duration-200" aria-label="再生"><PlayIcon /></button>
        <button onClick={onStop} disabled={!isPlaying} className="bg-gray-800 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed p-3 rounded-full text-white transition-colors duration-200" aria-label="停止"><StopIcon /></button>
      </div>
      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <label htmlFor="bpm" className="font-medium text-gray-400">BPM</label>
        <input type="range" id="bpm" min="40" max="240" value={bpm} onChange={(e) => onBpmChange(Number(e.target.value))} className="w-full sm:w-48 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
        <input type="number" value={bpm} onChange={(e) => onBpmChange(Number(e.target.value))} className="bg-gray-800 text-white w-20 text-center rounded-md p-1 border-gray-700 border" />
      </div>
       <div className="flex items-center space-x-3 w-full sm:w-auto">
        <label htmlFor="bars" className="font-medium text-gray-400">小節数</label>
        <input type="number" id="bars" min="1" max="128" value={bars} onChange={(e) => onBarsChange(Number(e.target.value))} className="bg-gray-800 text-white w-20 text-center rounded-md p-1 border-gray-700 border" />
      </div>
    </div>
);

const PianoRoll: React.FC<{ notes: Note[]; bars: number; currentStep: number; isPlaying: boolean; onNotesChange: (notes: Note[]) => void; zoom: number; }> = ({ notes, bars, currentStep, isPlaying, onNotesChange, zoom }) => {
  const steps = bars * 16;
  const gridRef = useRef<HTMLDivElement>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const dragInfoRef = useRef<{ noteId: string; startX: number; startY: number; startBeat: number; startPitchIndex: number; } | null>(null);
  const resizeInfoRef = useRef<{ noteId: string; startX: number; startDuration: number } | null>(null);
  const ROW_HEIGHT_REM = 1.5;
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
    dragInfoRef.current = { noteId: note.id, startX: e.clientX, startY: e.clientY, startBeat: note.startBeat, startPitchIndex: PIANO_ROLL_NOTES.indexOf(note.pitch) };
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragInfoRef.current) return;
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const stepWidthPx = STEP_WIDTH_REM * rootFontSize;
      const rowHeightPx = ROW_HEIGHT_REM * rootFontSize;
      const dx = moveEvent.clientX - dragInfoRef.current.startX;
      const dy = moveEvent.clientY - dragInfoRef.current.startY;
      const dSteps = Math.round(dx / stepWidthPx);
      const dPitch = Math.round(dy / rowHeightPx);
      const newStartStep = Math.max(0, Math.round(dragInfoRef.current.startBeat * 4) + dSteps);
      const newPitchIndex = Math.min(PIANO_ROLL_NOTES.length - 1, Math.max(0, dragInfoRef.current.startPitchIndex + dPitch));
      onNotesChange(notes.map(n => n.id === dragInfoRef.current!.noteId ? { ...n, startBeat: newStartStep / 4, pitch: PIANO_ROLL_NOTES[newPitchIndex] } : n));
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
    e.stopPropagation(); e.preventDefault();
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
    if (e.target === e.currentTarget) setSelectedNoteId(null);
  }

  return (
    <div className="relative h-full" ref={gridRef} onDoubleClick={handleGridDoubleClick} onClick={handleBackgroundClick}>
      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${steps}, ${STEP_WIDTH_REM}rem)` }}>
        {Array.from({ length: PIANO_ROLL_NOTES.length * steps }).map((_, i) => {
          const stepIndex = i % steps;
          const isBeat = stepIndex % 4 === 0;
          return <div key={i} className={`border-b border-r ${isBeat ? 'border-l-gray-600' : 'border-l-gray-700'} border-t-transparent border-r-gray-700 border-b-gray-700`} style={{ height: `${ROW_HEIGHT_REM}rem` }} />;
        })}
      </div>
      <div className="absolute inset-0">
        {notes.map((note) => {
          const noteIndex = PIANO_ROLL_NOTES.indexOf(note.pitch);
          if (noteIndex === -1) return null;
          const startStep = note.startBeat * 4;
          const durationSteps = note.duration * 4;
          const isSelected = note.id === selectedNoteId;
          return (
            <div key={note.id} data-role="note" onPointerDown={(e) => handleNotePointerDown(e, note)} onDoubleClick={(e) => { e.stopPropagation(); handleNoteDoubleClick(note); }} className={`absolute rounded flex items-center select-none cursor-grab transition-all duration-75 ease-in-out ${isSelected ? 'bg-cyan-400 ring-2 ring-offset-2 ring-offset-gray-800 ring-white shadow-lg' : 'bg-cyan-500 shadow-md'}`} style={{ top: `${noteIndex * ROW_HEIGHT_REM}rem`, left: `${startStep * STEP_WIDTH_REM}rem`, width: `${durationSteps * STEP_WIDTH_REM}rem`, height: `${ROW_HEIGHT_REM}rem`, touchAction: 'none' }}>
              <span className="text-xs text-black/70 pl-1 pointer-events-none truncate">{JAPANESE_NOTE_NAMES[note.pitch] || note.pitch}</span>
              <div data-role="note-resize-handle" onPointerDown={(e) => handleResizeStart(e, note)} className="absolute right-0 top-0 w-3 h-full cursor-ew-resize hover:bg-white/30 rounded-r" style={{ touchAction: 'none' }} />
            </div>
          );
        })}
      </div>
      {isPlaying && <div className="absolute top-0 bottom-0 w-1 bg-red-500/70 pointer-events-none" style={{ left: `${currentStep * STEP_WIDTH_REM}rem` }} />}
    </div>
  );
};

const DrumSequencer: React.FC<{ pattern: DrumPattern; bars: number; currentStep: number; isPlaying: boolean; onPatternChange: (newGrid: boolean[][]) => void; }> = ({ pattern, bars, currentStep, isPlaying, onPatternChange }) => {
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
              return <div key={`${soundIndex}-${stepIndex}`} onClick={() => handleStepClick(soundIndex, stepIndex)} className={`h-10 w-10 border-b border-r cursor-pointer transition-colors ${isActive ? 'bg-cyan-500' : (isBeat ? 'bg-gray-800' : 'bg-gray-800/70')} ${isBeat ? 'border-l-gray-600' : 'border-l-gray-700'}`} />;
            })}
          </React.Fragment>
        ))}
        </div>
        {isPlaying && <div className="absolute top-0 bottom-0 w-1 bg-red-500/70 pointer-events-none" style={{ left: `${currentStep * 2.5}rem` }} />}
    </div>
  );
};

const PianoKeyboard: React.FC<{ playNotePreview: (pitch: string) => void; }> = ({ playNotePreview }) => {
  const notes = PIANO_ROLL_NOTES.slice().reverse(); // A0からC8へ
  let whiteKeyX = 0;
  const WHITE_KEY_WIDTH = 24, WHITE_KEY_HEIGHT = 120, BLACK_KEY_WIDTH = 14, BLACK_KEY_HEIGHT = 80;
  const keyElements = notes.map((note) => {
    const isBlack = note.includes('#');
    if (isBlack) {
      const prevWhiteKeyX = whiteKeyX - WHITE_KEY_WIDTH;
      return { note, isBlack, x: prevWhiteKeyX + WHITE_KEY_WIDTH - (BLACK_KEY_WIDTH / 2), y: 0, width: BLACK_KEY_WIDTH, height: BLACK_KEY_HEIGHT };
    } else {
      const key = { note, isBlack, x: whiteKeyX, y: 0, width: WHITE_KEY_WIDTH, height: WHITE_KEY_HEIGHT };
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
        <g>{whiteKeys.map(({ note, x, y, width, height }) => <rect key={note} x={x} y={y} width={width} height={height} fill="white" stroke="black" strokeWidth="1" className="cursor-pointer active:fill-cyan-300" onPointerDown={() => playNotePreview(note)} />)}</g>
        <g>{blackKeys.map(({ note, x, y, width, height }) => <rect key={note} x={x} y={y} width={width} height={height} fill="black" stroke="black" strokeWidth="1" className="cursor-pointer active:fill-gray-600" onPointerDown={(e) => { e.stopPropagation(); playNotePreview(note); }} />)}</g>
      </svg>
    </div>
  );
};

const GuitarFretboard: React.FC<{ playNotePreview: (pitch: string) => void; }> = ({ playNotePreview }) => {
  const NUM_FRETS = 24, FRET_WIDTH = 80, STRING_SPACING = 25;
  const FRETBOARD_HEIGHT = 5 * STRING_SPACING + 20, FRETBOARD_WIDTH = (NUM_FRETS + 1) * FRET_WIDTH;
  const INLAY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
  const ALL_NOTES = PIANO_ROLL_NOTES.slice().reverse(); 
  const OPEN_STRINGS = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
  const getNoteForStringAndFret = (stringIndex: number, fret: number): string | null => {
    const openStringNote = OPEN_STRINGS[stringIndex];
    const openStringIndexInAllNotes = ALL_NOTES.indexOf(openStringNote);
    if (openStringIndexInAllNotes === -1) return null;
    const targetNoteIndex = openStringIndexInAllNotes + fret;
    return (targetNoteIndex >= 0 && targetNoteIndex < ALL_NOTES.length) ? ALL_NOTES[targetNoteIndex] : null;
  };
  const handleFretClick = (stringIndex: number, fret: number) => {
    const note = getNoteForStringAndFret(stringIndex, fret);
    if (note) playNotePreview(note);
  };
  return (
    <div className="overflow-x-auto bg-gray-900 h-48 flex-shrink-0 border-t-2 border-gray-700 select-none flex items-center">
      <svg width={FRETBOARD_WIDTH} height={FRETBOARD_HEIGHT} style={{ minWidth: FRETBOARD_WIDTH }}>
        <rect x="0" y="0" width={FRETBOARD_WIDTH} height={FRETBOARD_HEIGHT} fill="#6B462A" />
        {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
          <g key={`fret-${i}`}>
            <line x1={i * FRET_WIDTH + FRET_WIDTH / 2} y1="10" x2={i * FRET_WIDTH + FRET_WIDTH / 2} y2={FRETBOARD_HEIGHT - 10} stroke={i === 0 ? "#DDD" : "#AAA"} strokeWidth={i === 0 ? 8 : 4} />
            {i > 0 && <text x={i * FRET_WIDTH} y={FRETBOARD_HEIGHT - 2} textAnchor="middle" fill="#CCC" fontSize="10">{i}</text>}
          </g>
        ))}
        {INLAY_FRETS.map(fret => fret === 12 || fret === 24 ? (<g key={`inlay-${fret}`}><circle cx={(fret - 1) * FRET_WIDTH + FRET_WIDTH} cy={FRETBOARD_HEIGHT / 2 - STRING_SPACING} r="6" fill="#E0E0E0" opacity="0.7" /><circle cx={(fret - 1) * FRET_WIDTH + FRET_WIDTH} cy={FRETBOARD_HEIGHT / 2 + STRING_SPACING} r="6" fill="#E0E0E0" opacity="0.7" /></g>) : (<circle key={`inlay-${fret}`} cx={(fret - 1) * FRET_WIDTH + FRET_WIDTH} cy={FRETBOARD_HEIGHT / 2} r="6" fill="#E0E0E0" opacity="0.7" />))}
        {OPEN_STRINGS.map((_, stringIndex) => (
          <g key={`string-group-${stringIndex}`}>
            <line x1="0" y1={10 + stringIndex * STRING_SPACING} x2={FRETBOARD_WIDTH} y2={10 + stringIndex * STRING_SPACING} stroke="#555" strokeWidth={1 + stringIndex * 0.5} />
             {Array.from({ length: NUM_FRETS + 1 }).map((_, fretIndex) => <rect key={`clickable-${stringIndex}-${fretIndex}`} x={fretIndex * FRET_WIDTH} y={stringIndex * STRING_SPACING} width={FRET_WIDTH} height={STRING_SPACING} fill="transparent" className="cursor-pointer hover:fill-cyan-500/30 active:fill-cyan-500/50" onClick={() => handleFretClick(stringIndex, fretIndex)} />)}
          </g>
        ))}
      </svg>
    </div>
  );
};

const DetailView: React.FC<{ trackData: TrackType; currentStep: number; isPlaying: boolean; onUpdatePatternOrNotes: (newData: DrumPatternGrid | Note[]) => void; bars: number; containerRef: React.RefObject<HTMLDivElement>; playNotePreview: (pitch: string) => void; playDrumPreview: (soundIndex: number) => void; }> = ({ trackData, currentStep, isPlaying, onUpdatePatternOrNotes, bars, containerRef, playNotePreview, playDrumPreview }) => {
  type EditorView = 'pianoroll' | 'keyboard' | 'guitar' | 'drum_sequencer';
  const getInitialView = (track: TrackType): EditorView => track.type === 'drum' ? 'drum_sequencer' : 'pianoroll';
  const [zoom, setZoom] = useState(1);
  const [view, setView] = useState<EditorView>(() => getInitialView(trackData));
  const isSynthTrack = trackData.type === 'synth';
  const isDrumTrack = trackData.type === 'drum';
  const isGuitarTrack = isSynthTrack && trackData.instrument === 'guitar';

  const renderViewToggle = () => {
    if (!isSynthTrack) return null;
    const common = "px-3 py-1 text-sm font-semibold rounded-md transition-colors", active = "bg-cyan-500 text-white", inactive = "bg-gray-700 hover:bg-gray-600 text-gray-300";
    const pianoRollButton = <button onClick={() => setView('pianoroll')} className={`${common} ${view === 'pianoroll' ? active : inactive}`}>ピアノロール</button>;
    const instrumentButton = isGuitarTrack ? <button onClick={() => setView('guitar')} className={`${common} ${view === 'guitar' ? active : inactive}`}>ギター</button> : <button onClick={() => setView('keyboard')} className={`${common} ${view === 'keyboard' ? active : inactive}`}>鍵盤</button>;
    return <div className="flex items-center space-x-2 p-1 bg-gray-800 rounded-lg">{pianoRollButton}{instrumentButton}</div>;
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="flex-shrink-0 bg-gray-900 p-2 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-4"><h2 className="font-semibold text-white">MIDIエディター: <span className="text-cyan-400">{trackData.name}</span></h2>{renderViewToggle()}</div>
        {isSynthTrack && view === 'pianoroll' && <div className="flex items-center space-x-2"><span className="text-xs text-gray-400">ズーム</span><button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-center">-</button><input type="range" min="0.25" max="4" step="0.25" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" aria-label="ズームレベル" /><button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-center">+</button></div>}
      </header>
      <div className="flex-grow flex flex-col min-h-0">
        {view === 'pianoroll' && isSynthTrack && <div className="flex-grow overflow-auto" ref={containerRef}><div className="flex relative"><div className="flex-shrink-0 bg-gray-800 sticky left-0 z-10">{PIANO_ROLL_NOTES.map(note => <button key={note} onClick={() => playNotePreview(note)} className={`w-24 flex items-center justify-center border-b border-r border-gray-600 text-xs font-mono transition-colors ${note.includes('#') ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-300 text-black hover:bg-gray-400'}`} style={{ height: '1.5rem' }}>{JAPANESE_NOTE_NAMES[note] || note}</button>)}</div><div className="flex-grow"><PianoRoll notes={trackData.notes} bars={bars} currentStep={currentStep} isPlaying={isPlaying} onNotesChange={(newNotes) => onUpdatePatternOrNotes(newNotes)} zoom={zoom} /></div></div></div>}
        {view === 'keyboard' && isSynthTrack && <div className="flex-grow flex items-center justify-center bg-gray-900/50"><PianoKeyboard playNotePreview={playNotePreview} /></div>}
        {view === 'guitar' && isGuitarTrack && <div className="flex-grow flex items-center justify-center bg-gray-900/50"><GuitarFretboard playNotePreview={playNotePreview} /></div>}
        {isDrumTrack && <div className="flex-grow overflow-auto" ref={containerRef}><div className="flex relative"><div className="flex-shrink-0 bg-gray-800 sticky left-0 z-10"><div>{trackData.pattern.sounds.map((sound, index) => <button key={sound} onClick={() => playDrumPreview(index)} className="h-10 w-24 flex items-center justify-center bg-gray-700 hover:bg-gray-600 border-b border-r border-gray-600 text-sm font-semibold capitalize transition-colors">{JAPANESE_DRUM_NAMES[sound] || sound}</button>)}</div></div><div className="flex-grow"><DrumSequencer pattern={trackData.pattern} bars={bars} currentStep={currentStep} isPlaying={isPlaying} onPatternChange={(newGrid) => onUpdatePatternOrNotes(newGrid)} /></div></div></div>}
      </div>
    </div>
  );
};

const TimelineRuler: React.FC<{ bars: number; currentStep: number; isPlaying: boolean; stepWidthPx: number; loopStartBar: number; loopEndBar: number; onLoopRangeChange: (start: number, end: number) => void; arrangementContainerRef: React.RefObject<HTMLDivElement>; }> = ({ bars, stepWidthPx, loopStartBar, loopEndBar, onLoopRangeChange, arrangementContainerRef }) => {
    const totalSteps = bars * 16, width = totalSteps * stepWidthPx;
    const rulerRef = useRef<HTMLDivElement>(null), dragStartBar = useRef<number | null>(null), autoScrollIntervalRef = useRef<number | null>(null);
    const stopAutoScroll = () => { if (autoScrollIntervalRef.current) { clearInterval(autoScrollIntervalRef.current); autoScrollIntervalRef.current = null; } };
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!rulerRef.current || !arrangementContainerRef.current) return;
        const arrangementContainer = arrangementContainerRef.current, arrangementRect = arrangementContainer.getBoundingClientRect(), barWidth = 16 * stepWidthPx;
        const getBarFromClientX = (clientX: number) => Math.max(1, Math.min(bars, Math.floor((clientX - arrangementRect.left + arrangementContainer.scrollLeft) / barWidth) + 1));
        const clickedBar = getBarFromClientX(e.clientX);
        dragStartBar.current = clickedBar;
        onLoopRangeChange(clickedBar, clickedBar);
        const handlePointerMove = (moveEvent: PointerEvent) => {
            if (dragStartBar.current === null) return;
            moveEvent.preventDefault();
            const clientX = moveEvent.clientX;
            stopAutoScroll();
            const currentBar = getBarFromClientX(clientX);
            onLoopRangeChange(dragStartBar.current, currentBar);
            const scrollMargin = 60, scrollSpeed = 15;
            if (clientX < arrangementRect.left + scrollMargin) autoScrollIntervalRef.current = window.setInterval(() => { arrangementContainer.scrollLeft -= scrollSpeed; onLoopRangeChange(dragStartBar.current!, getBarFromClientX(arrangementRect.left)); }, 30);
            else if (clientX > arrangementRect.right - scrollMargin) autoScrollIntervalRef.current = window.setInterval(() => { arrangementContainer.scrollLeft += scrollSpeed; onLoopRangeChange(dragStartBar.current!, getBarFromClientX(arrangementRect.right)); }, 30);
        };
        const handlePointerUp = () => { stopAutoScroll(); dragStartBar.current = null; window.removeEventListener('pointermove', handlePointerMove); window.removeEventListener('pointerup', handlePointerUp); };
        window.addEventListener('pointermove', handlePointerMove); window.addEventListener('pointerup', handlePointerUp);
    };
    const markers = [];
    for (let i = 0; i < totalSteps; i++) {
        if (i % 16 === 0) markers.push(<div key={`bar-${i}`} className="text-xs text-gray-400 absolute select-none" style={{left: `${i * stepWidthPx}px`}}>{i / 16 + 1}</div>);
        else if (i % 4 === 0) markers.push(<div key={`beat-${i}`} className="w-px h-1 bg-gray-500 absolute bottom-0" style={{left: `${i * stepWidthPx}px`}} />);
    }
    const loopRegionLeft = (loopStartBar - 1) * 16 * stepWidthPx;
    const loopRegionWidth = (loopEndBar - loopStartBar + 1) * 16 * stepWidthPx;
    return <div ref={rulerRef} className="relative h-6 cursor-pointer touch-none" style={{width: `${width}px`}} onPointerDown={handlePointerDown} onDoubleClick={() => onLoopRangeChange(1, bars)}><div className="absolute top-0 h-full bg-cyan-500/20 rounded" style={{ left: `${loopRegionLeft}px`, width: `${loopRegionWidth}px`, pointerEvents: 'none' }} />{markers}</div>;
};

const Clip: React.FC<{trackData: TrackType, totalSteps: number, stepWidthPx: number}> = ({ trackData, totalSteps, stepWidthPx }) => {
    const width = totalSteps * stepWidthPx;
    const renderGrid = () => Array.from({ length: totalSteps }).map((_, i) => <div key={i} className={`h-full ${i % 16 === 0 ? 'border-l-gray-600' : i % 4 === 0 ? 'border-l-gray-700' : 'border-l-gray-800'}`} style={{width: `${stepWidthPx}px`, borderLeftWidth: '1px'}} />);
    const renderSynthNotes = (notes: Note[]) => {
        const noteRange = PIANO_ROLL_NOTES.length;
        return notes.map((note, i) => <div key={i} className="absolute bg-cyan-500 rounded-sm" style={{ left: `${note.startBeat * 4 * stepWidthPx}px`, width: `${note.duration * 4 * stepWidthPx}px`, top: `${(1 - (PIANO_ROLL_NOTES.indexOf(note.pitch) / noteRange)) * 100}%`, height: '4px', transform: 'translateY(-50%)' }} />);
    };
    const renderDrumHits = (grid: DrumPatternGrid) => grid.flatMap((row, soundIndex) => row.map((isActive, stepIndex) => isActive ? <div key={`${soundIndex}-${stepIndex}`} className="absolute bg-cyan-500 rounded-full" style={{ left: `${stepIndex * stepWidthPx + stepWidthPx/2 - 2}px`, top: `${(soundIndex / grid.length) * 100 + (100 / (grid.length*2))}%`, width: '4px', height: '4px', transform: 'translateY(-50%)' }} /> : null));
    return <div className="relative h-full bg-gray-800/50 clip-container" style={{ width: `${width}px` }}><div className="absolute inset-0 flex">{renderGrid()}</div><div className="absolute inset-0">{trackData.type === 'synth' ? renderSynthNotes(trackData.notes) : renderDrumHits(trackData.pattern.grid)}</div></div>;
};

const Track: React.FC<{ trackData: TrackType; isSelected: boolean; onSelect: () => void; onUpdateTrack: (updatedProps: Partial<TrackType>) => void; onDeleteTrack: () => void; totalSteps: number; stepWidthPx: number; }> = ({ trackData, isSelected, onSelect, onUpdateTrack, onDeleteTrack, totalSteps, stepWidthPx }) => (
    <div className={`flex items-stretch border-b border-gray-800 cursor-pointer ${isSelected ? 'bg-gray-700/50' : 'hover:bg-gray-800/50'}`} onClick={onSelect}>
      <div className={`w-48 flex-shrink-0 bg-gray-800 p-3 flex flex-col space-y-3 border-r ${isSelected ? 'border-cyan-500' : 'border-gray-700'} sticky left-0 z-10`}>
        <input type="text" value={trackData.name} onClick={e => e.stopPropagation()} onChange={e => onUpdateTrack({ name: e.target.value })} className="bg-gray-700 text-white font-semibold w-full text-center rounded p-1 border-transparent focus:border-cyan-500 focus:ring-0" />
         {trackData.type === 'synth' && <div className="flex items-center space-x-2"><label htmlFor={`instrument-${trackData.id}`} className="text-xs text-gray-400 flex-shrink-0">音色</label><select id={`instrument-${trackData.id}`} value={trackData.instrument} onClick={e => e.stopPropagation()} onChange={(e) => onUpdateTrack({ instrument: e.target.value as SynthInstrumentType })} className="w-full bg-gray-600 text-white text-xs rounded p-1 border-transparent focus:border-cyan-500 focus:ring-0 appearance-none text-center" style={{ textOverflow: 'ellipsis' }}>{Object.entries(JAPANESE_INSTRUMENT_NAMES).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></div>}
        <div className="flex items-center space-x-2"><label htmlFor={`volume-${trackData.id}`} className="text-xs text-gray-400">音量</label><input id={`volume-${trackData.id}`} type="range" min="0" max="1" step="0.01" value={trackData.volume} onClick={e => e.stopPropagation()} onChange={e => onUpdateTrack({ volume: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" /></div>
        <div className="flex items-center justify-around">
            <button onClick={(e) => { e.stopPropagation(); onUpdateTrack({ muted: !trackData.muted }); }} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${trackData.muted ? 'bg-yellow-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`} aria-label={trackData.muted ? "ミュート解除" : "ミュート"}>M</button>
            <button onClick={(e) => { e.stopPropagation(); onUpdateTrack({ soloed: !trackData.soloed }); }} className={`w-8 h-8 flex items-center justify-center font-bold text-sm rounded-full transition-colors ${trackData.soloed ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`} aria-label={trackData.soloed ? "ソロ解除" : "ソロ"}>S</button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteTrack(); }} className="p-2 rounded-full bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white transition-colors" aria-label="トラックを削除"><TrashIcon /></button>
        </div>
      </div>
      <div className="flex-grow relative"><Clip trackData={trackData} totalSteps={totalSteps} stepWidthPx={stepWidthPx} /></div>
    </div>
);

// --- MAIN APP COMPONENT (from App.tsx) ---
const App: React.FC = () => {
  const getInitialData = (): SessionData => {
    if ((window as any).INITIAL_SESSION_DATA) {
        try { return (window as any).INITIAL_SESSION_DATA as SessionData; }
        catch (e) { console.error("インジェクトされたセッションデータの解析に失敗しました:", e); }
    }
    try {
        const data = new URLSearchParams(window.location.search).get('data');
        if (data) { const decodedData = decodeSessionData(data); if (decodedData) return decodedData; }
    } catch (error) { console.error("URLからのデータ読み込みに失敗しました:", error); }
    return DEFAULT_SESSION_DATA;
  };

  const [sessionData, setSessionData] = useState<SessionData>(getInitialData);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isAudioEngineReady, setIsAudioEngineReady] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(getInitialData().tracks[0]?.id ?? null);
  const audioEngine = useRef<AudioEngine | null>(null);
  const arrangementContainerRef = useRef<HTMLDivElement>(null);
  const detailContainerRef = useRef<HTMLDivElement>(null);

  const initAudioEngine = async () => {
      if (!audioEngine.current) {
          audioEngine.current = new AudioEngine();
          await audioEngine.current.init();
          setIsAudioEngineReady(true);
      }
  };

  const play = async () => {
      if (!audioEngine.current || !isAudioEngineReady) await initAudioEngine();
      if (!audioEngine.current) return;
      if (!isPlaying) {
          setCurrentStep((sessionData.loopStartBar - 1) * 16);
          audioEngine.current.start();
          setIsPlaying(true);
      }
  };
  
  const stop = () => {
    if (audioEngine.current && isPlaying) {
      audioEngine.current.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    }
  };
  
  useEffect(() => {
    if (isPlaying && isAudioEngineReady && audioEngine.current) {
        const scheduler = () => {
            const now = audioEngine.current!.getCurrentTime();
            const stepDuration = 60 / sessionData.bpm / 4;
            const loopStartStep = (sessionData.loopStartBar - 1) * 16;
            const loopEndStep = sessionData.loopEndBar * 16;
            const loopDurationSteps = loopEndStep - loopStartStep;
            if (loopDurationSteps <= 0) return;
            const newCurrentStep = loopStartStep + (Math.floor(now / stepDuration) % loopDurationSteps);
            setCurrentStep(newCurrentStep);

            const scrollIntoViewIfNeeded = (container: HTMLDivElement | null, stepWidth: number) => {
                if (!container) return;
                const playheadPosition = newCurrentStep * stepWidth;
                if (playheadPosition < container.scrollLeft || playheadPosition >= container.scrollLeft + container.clientWidth) {
                    container.scrollLeft = playheadPosition - container.clientWidth / 2;
                }
            };
            scrollIntoViewIfNeeded(arrangementContainerRef.current, STEP_WIDTH_PX);
             if (detailContainerRef.current) {
                const detailGrid = detailContainerRef.current.querySelector('.grid');
                if (detailGrid) scrollIntoViewIfNeeded(detailContainerRef.current, detailGrid.clientWidth / (sessionData.bars * 16));
            }

            const anySolo = sessionData.tracks.some(t => t.soloed);
            sessionData.tracks.forEach(track => {
                if (track.muted || (anySolo && !track.soloed)) return;
                if (track.type === 'drum') track.pattern.grid.forEach((row, soundIndex) => { if (row[newCurrentStep]) audioEngine.current?.playDrum(track.pattern.sounds[soundIndex], now + 0.05, track.volume); });
                else if (track.type === 'synth') track.notes.forEach(note => { if (note.startBeat * 4 === newCurrentStep) audioEngine.current?.playSynth(note.pitch, now + 0.05, note.duration * stepDuration, track.volume, track.instrument); });
            });
        };
        const timerId = setInterval(scheduler, 50);
        return () => clearInterval(timerId);
    }
  }, [isPlaying, isAudioEngineReady, sessionData]);

  const updateBPM = (newBpm: number) => setSessionData(prev => ({ ...prev, bpm: newBpm }));
  const updateBars = (newBars: number) => {
    setSessionData(prev => {
        const clampedBars = Math.max(1, Math.min(128, newBars));
        const newTotalSteps = clampedBars * 16;
        const newTracks = prev.tracks.map(track => {
            if (track.type === 'drum') {
                const newGrid = track.pattern.grid.map(row => row.length > newTotalSteps ? row.slice(0, newTotalSteps) : [...row, ...Array(newTotalSteps - row.length).fill(false)]);
                return { ...track, pattern: { ...track.pattern, grid: newGrid } };
            }
            if (track.type === 'synth') return { ...track, notes: track.notes.filter(note => (note.startBeat * 4) < newTotalSteps) };
            return track;
        });
        return { ...prev, bars: clampedBars, tracks: newTracks, loopEndBar: Math.min(prev.loopEndBar, clampedBars) };
    });
  };
  const updateLoopRange = (start: number, end: number) => setSessionData(prev => ({ ...prev, loopStartBar: Math.max(1, Math.min(start, end)), loopEndBar: Math.min(prev.bars, Math.max(start, end)) }));
  const addTrack = (type: 'synth' | 'drum') => {
      const newId = `track-${type}-${Date.now()}`;
      const newTrack: TrackType = type === 'synth' ? 
        { id: newId, type: 'synth', name: '新規シンセ', instrument: 'piano', volume: 0.8, muted: false, soloed: false, notes: [] } as SynthTrack :
        { id: newId, type: 'drum', name: '新規ドラム', volume: 1.0, muted: false, soloed: false, pattern: { sounds: ['kick', 'snare', 'hihat', 'clap'], grid: Array(4).fill(null).map(() => Array(sessionData.bars * 16).fill(false)) } } as DrumTrack;
      setSessionData(prev => ({ ...prev, tracks: [...prev.tracks, newTrack] }));
      setSelectedTrackId(newId);
  };
  const deleteTrack = (trackId: string) => {
      setSessionData(prev => {
        const newTracks = prev.tracks.filter(track => track.id !== trackId);
        if(selectedTrackId === trackId) setSelectedTrackId(newTracks[0]?.id ?? null);
        return { ...prev, tracks: newTracks };
      });
  };
  const updateTrackProperties = (trackId: string, updatedProps: Partial<TrackType>) => setSessionData(prev => ({ ...prev, tracks: prev.tracks.map(track => track.id === trackId ? { ...track, ...updatedProps } as TrackType : track) }));
  const updateTrackPatternOrNotes = (trackId: string, newData: DrumPatternGrid | Note[]) => {
    setSessionData(prev => ({ ...prev, tracks: prev.tracks.map(track => {
        if (track.id === trackId) {
          if (track.type === 'drum') return { ...track, pattern: { ...track.pattern, grid: newData as DrumPatternGrid } };
          if (track.type === 'synth') return { ...track, notes: newData as Note[] };
        } return track;
      })
    }));
  };
  const handleShare = () => { setShareUrl(encodeSessionData(sessionData)); setIsShareModalOpen(true); };
  const playNotePreview = (pitch: string) => {
    const track = sessionData.tracks.find(t => t.id === selectedTrackId);
    if (!audioEngine.current || !track || track.type !== 'synth') return;
    audioEngine.current.playSynth(pitch, audioEngine.current.getCurrentTime(), 0.25, track.volume, track.instrument);
    updateTrackPatternOrNotes(track.id, [...track.notes, { id: `note-${Date.now()}`, pitch, startBeat: currentStep / 4, duration: 0.25 }]);
  };
  const playDrumPreview = (soundIndex: number) => {
      const track = sessionData.tracks.find(t => t.id === selectedTrackId);
      if (!audioEngine.current || !track || track.type !== 'drum') return;
      audioEngine.current.playDrum(track.pattern.sounds[soundIndex], audioEngine.current.getCurrentTime(), track.volume);
      const newGrid = track.pattern.grid.map(row => [...row]);
      if (newGrid[soundIndex] && currentStep < newGrid[soundIndex].length) newGrid[soundIndex][currentStep] = !newGrid[soundIndex][currentStep];
      updateTrackPatternOrNotes(track.id, newGrid);
  };

  if (!isAudioEngineReady) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
              <h1 className="text-4xl font-bold mb-4">ウェブDAW</h1>
              <p className="text-gray-400 mb-8">オーディオエンジンを起動して創作を始めましょう。</p>
              <button onClick={initAudioEngine} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center space-x-3"><PlayIcon /><span>創作を始める</span></button>
          </div>
      );
  }

  const selectedTrack = sessionData.tracks.find(t => t.id === selectedTrackId);
  const totalSteps = sessionData.bars * 16;
  const STEP_WIDTH_PX = 24;
  const arrangementWidth = totalSteps * STEP_WIDTH_PX;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-200 font-sans">
      <header className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
          <h1 className="text-3xl font-bold text-white tracking-tight">ウェブDAW<span className="text-cyan-400">.</span></h1>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <HelpTooltip />
            <button onClick={() => setIsDeployModalOpen(true)} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200">デプロイ</button>
            <button onClick={handleShare} className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200">プロジェクトを共有</button>
          </div>
      </header>
      
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800"><Transport isPlaying={isPlaying} onPlay={play} onStop={stop} bpm={sessionData.bpm} onBpmChange={updateBPM} bars={sessionData.bars} onBarsChange={updateBars} /></div>

      <main className="flex-grow flex flex-col min-h-0">
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-auto overscroll-y-contain overscroll-x-none" ref={arrangementContainerRef}>
            <div className="relative" style={{ width: `${arrangementWidth}px`}}>
              <div className="sticky top-0 z-20 flex bg-gray-800 border-b border-gray-700">
                <div className="w-48 flex-shrink-0 p-2 font-semibold px-3 border-r border-gray-700 flex items-center">トラック</div>
                <div className="flex-grow"><TimelineRuler bars={sessionData.bars} currentStep={currentStep} isPlaying={isPlaying} stepWidthPx={STEP_WIDTH_PX} loopStartBar={sessionData.loopStartBar} loopEndBar={sessionData.loopEndBar} onLoopRangeChange={updateLoopRange} arrangementContainerRef={arrangementContainerRef} /></div>
              </div>
              {sessionData.tracks.map(track => <Track key={track.id} trackData={track} isSelected={track.id === selectedTrackId} onSelect={() => setSelectedTrackId(track.id)} onUpdateTrack={(props) => updateTrackProperties(track.id, props)} onDeleteTrack={() => deleteTrack(track.id)} totalSteps={totalSteps} stepWidthPx={STEP_WIDTH_PX} />)}
              {isPlaying && <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/90 pointer-events-none z-30" style={{ left: `${currentStep * STEP_WIDTH_PX}px`, height: '100%' }} />}
            </div>
          </div>
          <div className="flex-shrink-0 p-3 flex items-center space-x-2 border-t border-gray-800 bg-gray-800">
              <button onClick={() => addTrack('synth')} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"><PlusIcon /> <span>シンセを追加</span></button>
              <button onClick={() => addTrack('drum')} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"><PlusIcon /> <span>ドラムを追加</span></button>
          </div>
        </div>
        <div className="h-[45%] flex-shrink-0 border-t-2 border-gray-700 flex flex-col bg-gray-900">
            {selectedTrack ? <DetailView key={selectedTrack.id} trackData={selectedTrack} currentStep={currentStep} isPlaying={isPlaying} onUpdatePatternOrNotes={(newData) => updateTrackPatternOrNotes(selectedTrack.id, newData)} bars={sessionData.bars} containerRef={detailContainerRef} playNotePreview={playNotePreview} playDrumPreview={playDrumPreview} /> : <div className="flex items-center justify-center h-full text-gray-500">編集するトラックを選択してください</div>}
        </div>
      </main>

      {isShareModalOpen && <ShareModal url={shareUrl} onClose={() => setIsShareModalOpen(false)} />}
      {isDeployModalOpen && <DeployModal sessionData={sessionData} onClose={() => setIsDeployModalOpen(false)} />}
    </div>
  );
};

// --- RENDER APP (from original index.tsx) ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
