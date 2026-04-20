// ============================================================
// === FACTORY PATTERN IMPLEMENTED HERE ===
// Explanation: SoundFactory is a Factory that creates different
// SoundGenerator objects based on the requested type.
// Each noise type (white, pink, brown) and ambient sound is a
// different product, but they all implement the same SoundGenerator
// interface. The Factory encapsulates the creation logic so the
// client code doesn't need to know which specific class to instantiate.
// ============================================================

import { SoundGenerator, NoiseType, AmbientType } from '@/types';

// === AudioContext Singleton ===
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ============================================================
// === FACTORY PRODUCTS: Each noise generator is a concrete product ===
// ============================================================

class WhiteNoiseGenerator implements SoundGenerator {
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private playing = false;

  start(): void {
    if (this.playing) return;
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // White noise: pure random values
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0.3;

    this.source.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    this.source.start();
    this.playing = true;
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.playing = false;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getType(): string {
    return 'white-noise';
  }
}

class PinkNoiseGenerator implements SoundGenerator {
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private playing = false;

  start(): void {
    if (this.playing) return;
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Pink noise using Paul Kellet's refined method
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0.3;

    this.source.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    this.source.start();
    this.playing = true;
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.playing = false;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getType(): string {
    return 'pink-noise';
  }
}

class BrownNoiseGenerator implements SoundGenerator {
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private playing = false;

  start(): void {
    if (this.playing) return;
    const ctx = getAudioContext();
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Brown noise: integrated white noise
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // amplify
    }

    this.source = ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0.3;

    this.source.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    this.source.start();
    this.playing = true;
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.playing = false;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getType(): string {
    return 'brown-noise';
  }
}

class FrequencyGenerator implements SoundGenerator {
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private playing = false;
  private frequency: number;

  constructor(frequency: number = 432) {
    this.frequency = frequency;
  }

  start(): void {
    if (this.playing) return;
    const ctx = getAudioContext();

    this.oscillator = ctx.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = this.frequency;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0.15;

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);
    this.oscillator.start();
    this.playing = true;
  }

  stop(): void {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.playing = false;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume)) * 0.3;
    }
  }

  setFrequency(freq: number): void {
    this.frequency = freq;
    if (this.oscillator) {
      this.oscillator.frequency.value = freq;
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getType(): string {
    return `frequency-${this.frequency}`;
  }
}

class AmbientSoundPlayer implements SoundGenerator {
  private audio: HTMLAudioElement | null = null;
  private playing = false;
  private ambientType: AmbientType;

  constructor(type: AmbientType) {
    this.ambientType = type;
  }

  start(): void {
    if (this.playing) return;
    // Use embedded audio data URLs for ambient sounds (synthesized)
    this.audio = new Audio(`/ambient/${this.ambientType}.mp3`);
    this.audio.loop = true;
    this.audio.volume = 0.4;
    this.audio.play().catch(() => {
      // Audio play failed — user interaction needed
    });
    this.playing = true;
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio = null;
    }
    this.playing = false;
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getType(): string {
    return `ambient-${this.ambientType}`;
  }
}

// ============================================================
// === THE FACTORY: Creates the appropriate SoundGenerator ===
// ============================================================

export class SoundFactory {
  /**
   * === FACTORY METHOD ===
   * Creates a SoundGenerator based on the requested type.
   * The client doesn't need to know which concrete class to use.
   */
  static createNoise(type: NoiseType): SoundGenerator {
    switch (type) {
      case 'white':
        return new WhiteNoiseGenerator();
      case 'pink':
        return new PinkNoiseGenerator();
      case 'brown':
        return new BrownNoiseGenerator();
      default:
        throw new Error(`Unknown noise type: ${type}`);
    }
  }

  static createFrequency(frequency: number = 432): FrequencyGenerator {
    return new FrequencyGenerator(frequency);
  }

  static createAmbient(type: AmbientType): SoundGenerator {
    return new AmbientSoundPlayer(type);
  }
}

export { FrequencyGenerator };
