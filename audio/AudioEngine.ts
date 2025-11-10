
import type { DrumInstrument, SynthInstrumentType } from '../types';

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

    // 88鍵（A0からC8まで）の周波数を生成
    for (let i = 0; i < 88; i++) {
        const noteName = noteNames[(i + 9) % 12];
        const octave = Math.floor((i + 9) / 12);
        const note = `${noteName}${octave}`;
        
        // A4は49番目のキーなので、オフセットは0。A0は1番目のキーなので、オフセットは-48。
        const keyNumber = i - 48;
        const frequency = a4 * Math.pow(2, keyNumber / 12);
        frequencies[note] = frequency;
    }
    return frequencies;
};

const NOTE_FREQUENCIES = generateFrequencies();

export class AudioEngine {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private drumSamples: { [key in DrumInstrument]: (ctx: AudioContext, time: number, destination: AudioNode) => void };

    constructor() {
        this.drumSamples = {
            kick: createKick,
            snare: createSnare,
            hihat: createHihat,
            clap: createClap,
        };
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

    stop() {
        // In a real DAW, you'd track active sources and stop them.
    }

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

                // ADSR Envelope
                const attackTime = 0.01;
                const decayTime = 0.2;
                const sustainLevel = 0.6;
                const releaseTime = 0.5; // 余韻

                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(volume, time + attackTime);
                gainNode.gain.exponentialRampToValueAtTime(volume * sustainLevel, time + attackTime + decayTime);
                
                // ノートの持続時間が終わる時点でリリースを開始
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
        
                if (delayTime > 1.0) return; // 低すぎる音は処理を避ける
        
                // ノイズの短いバーストを生成
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
        
                // フィードバックループの接続
                noise.connect(filter);
                filter.connect(delayNode);
                delayNode.connect(feedbackGain);
                feedbackGain.connect(filter);
        
                // ループの出力をメインのゲインノードに接続
                delayNode.connect(gainNode);
        
                // 全体の音量エンベロープ
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(volume * 0.9, time + 0.01); // 速いアタック
                gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration + 1.5); // 1.5秒の余韻を許容
        
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
                bassOsc.frequency.setValueAtTime(freq / 2, time); // One octave lower
                
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
                return; // Early return for special case
            case 'sawtooth':
            case 'square':
            case 'sine':
            case 'triangle':
            default:
                const osc = this.audioContext.createOscillator();
                osc.type = instrument;
                osc.frequency.setValueAtTime(freq, time);
                gainNode.gain.setValueAtTime(0, time);
                gainNode.gain.linearRampToValueAtTime(0.5 * volume, time + 0.01); // Attack
                gainNode.gain.linearRampToValueAtTime(0, time + duration); // Decay + Release
                osc.connect(gainNode);
                osc.start(time);
                osc.stop(time + duration);
                break;
        }
    }
}