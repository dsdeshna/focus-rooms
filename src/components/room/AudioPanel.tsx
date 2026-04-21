// Audio Panel (Factory pattern)
// This component uses SoundFactory to create different sound
// generators. The UI doesn't know which concrete class is
// instantiated — it just calls SoundFactory.createNoise() or
// SoundFactory.createAmbient() and gets back a SoundGenerator.

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SoundFactory, FrequencyGenerator } from '@/lib/audio/SoundFactory';
import { SoundGenerator, NoiseType, AmbientType, RoomEvent } from '@/types';
import { RealtimeManager } from '@/lib/realtime/RealtimeManager';
import { Volume2, VolumeX, Wind, CloudRain, Trees, Waves, Flame, CloudSun, Radio } from 'lucide-react';

interface AudioPanelProps {
  readonly realtimeManager: RealtimeManager | null;
  readonly userId: string;
  readonly userName: string;
}

interface ActiveSound {
  readonly generator: SoundGenerator;
  readonly volume: number;
}

const NOISE_TYPES: { type: NoiseType; label: string; dot: string; desc: string }[] = [
  { type: 'white', label: 'White', dot: '#E8E8E8', desc: 'all frequencies' },
  { type: 'pink',  label: 'Pink',  dot: '#F0B8CC', desc: 'warm & balanced' },
  { type: 'brown', label: 'Brown', dot: '#C09870', desc: 'deep & grounding' },
];

const AMBIENT_TYPES: { type: AmbientType; label: string; icon: React.ReactNode; emoji: string }[] = [
  { type: 'rain',      label: 'Rain',     icon: <CloudRain size={15} />, emoji: '🌧️' },
  { type: 'cafe',      label: 'Café',     icon: <CloudSun size={15} />,  emoji: '☕' },
  { type: 'forest',    label: 'Forest',   icon: <Trees size={15} />,     emoji: '🌿' },
  { type: 'ocean',     label: 'Ocean',    icon: <Waves size={15} />,     emoji: '🌊' },
  { type: 'fireplace', label: 'Fireplace',icon: <Flame size={15} />,     emoji: '🔥' },
  { type: 'wind',      label: 'Wind',     icon: <Wind size={15} />,      emoji: '🍃' },
];

const AMBIENT_AUDIO: Record<AmbientType, string> = {
  rain: '/audio/rain.mp3',
  cafe: '/audio/cafe.mp3',
  forest: '/audio/forest.mp3',
  ocean: '/audio/ocean.mp3',
  fireplace: '/audio/fireplace.mp3',
  wind: '/audio/wind.mp3',
};

const FREQ_PRESETS = [174, 285, 396, 432, 528, 639, 741, 852, 963];

export function AudioPanel({ realtimeManager, userId, userName }: AudioPanelProps) {
  const [activeSounds, setActiveSounds] = useState<Map<string, ActiveSound>>(new Map());
  const [frequency, setFrequency] = useState(432);
  const [freqActive, setFreqActive] = useState(false);
  const freqGenRef = useRef<FrequencyGenerator | null>(null);

  // --- INTERNAL TOGGLES (Moved up to fix declaration order) ---
  const fadeOut = useCallback((audio: HTMLAudioElement) => {
    let vol = audio.volume;
    const interval = globalThis.setInterval(() => {
      if (vol <= 0.05) {
        audio.pause();
        audio.currentTime = 0;
        globalThis.clearInterval(interval);
      } else {
        vol -= 0.05;
        audio.volume = vol;
      }
    }, 30);
  }, []);

  const toggleNoiseInternal = useCallback((type: NoiseType, broadcast: boolean, initialVolume?: number, forceOn?: boolean) => {
    const key = `noise-${type}`;
    const existing = activeSounds.get(key);
    
    if (existing && !forceOn) {
      existing.generator.stop();
      setActiveSounds(prev => { const n = new Map(prev); n.delete(key); return n; });
    } else if (!existing) {
      const generator = SoundFactory.createNoise(type);
      const volume = typeof initialVolume === 'number' ? initialVolume : 0.3;
      generator.setVolume(volume);
      generator.start();
      setActiveSounds(prev => new Map(prev).set(key, { generator, volume }));
    }

    if (broadcast && realtimeManager) {
      realtimeManager.broadcastEvent({ 
        type: 'atmosphere-changed', userId, userName, 
        data: { action: 'toggle-noise', soundType: type }, timestamp: Date.now() 
      });
    }
  }, [activeSounds, realtimeManager, userId, userName]);

  const toggleAmbientInternal = useCallback((type: AmbientType, broadcast: boolean, initialVolume?: number, forceOn?: boolean) => {
    const key = `ambient-${type}`;
    const existing = activeSounds.get(key);

    if (existing && !forceOn) {
      existing.generator.stop();
      setActiveSounds(prev => { const n = new Map(prev); n.delete(key); return n; });
    } else if (!existing) {
      const audio = new Audio(AMBIENT_AUDIO[type]);
      audio.loop = true;
      const volume = typeof initialVolume === 'number' ? initialVolume : 0.4;
      audio.volume = volume;
      audio.play().catch(() => {});

      const generator: SoundGenerator & { _audio: HTMLAudioElement } = {
        _audio: audio,
        start: () => {
          audio.volume = 0;
          audio.play().catch(() => {});
          let vol = 0;
          const interval = globalThis.setInterval(() => {
            if (vol >= volume) globalThis.clearInterval(interval);
            else { vol += 0.05; audio.volume = Math.min(vol, volume); }
          }, 30);
        },
        stop: () => fadeOut(audio),
        setVolume: (v: number) => { audio.volume = v; },
        isPlaying: () => !audio.paused,
        getType: () => `ambient-${type}`,
      };

      setActiveSounds(prev => new Map(prev).set(key, { generator, volume }));
    }

    if (broadcast && realtimeManager) {
      realtimeManager.broadcastEvent({ 
        type: 'atmosphere-changed', userId, userName, 
        data: { action: 'toggle-ambient', soundType: type }, timestamp: Date.now() 
      });
    }
  }, [activeSounds, fadeOut, realtimeManager, userId, userName]);

  const handleVolumeChangeInternal = useCallback((key: string, volume: number, broadcast: boolean) => {
    const sound = activeSounds.get(key);
    if (!sound) return;
    sound.generator.setVolume(volume);
    setActiveSounds(prev => new Map(prev).set(key, { ...sound, volume }));

    if (broadcast && realtimeManager) {
      realtimeManager.broadcastEvent({ 
        type: 'atmosphere-changed', userId, userName, 
        data: { action: 'volume-change', key, volume }, timestamp: Date.now() 
      });
    }
  }, [activeSounds, realtimeManager, userId, userName]);

  const toggleFrequencyInternal = useCallback((broadcast: boolean) => {
    if (freqActive && freqGenRef.current) {
      freqGenRef.current.stop();
      freqGenRef.current = null;
      setFreqActive(false);
    } else {
      const gen = SoundFactory.createFrequency(frequency);
      gen.start();
      freqGenRef.current = gen;
      setFreqActive(true);
    }

    if (broadcast && realtimeManager) {
      realtimeManager.broadcastEvent({ 
        type: 'atmosphere-changed', userId, userName, 
        data: { action: 'toggle-freq' }, timestamp: Date.now() 
      });
    }
  }, [freqActive, frequency, realtimeManager, userId, userName]);

  const handleFrequencyChangeInternal = useCallback((f: number, broadcast: boolean, forceOn?: boolean) => {
    setFrequency(f);
    if (freqGenRef.current) {
      freqGenRef.current.setFrequency(f);
    } else if (forceOn) {
      const gen = SoundFactory.createFrequency(f);
      gen.start();
      freqGenRef.current = gen;
      setFreqActive(true);
    }

    if (broadcast && realtimeManager) {
      realtimeManager.broadcastEvent({ 
        type: 'atmosphere-changed', userId, userName, 
        data: { action: 'freq-change', freq: f }, timestamp: Date.now() 
      });
    }
  }, [realtimeManager, userId, userName]);

  // --- SYNC HELPERS ---
  const syncToggleNoise = useCallback((type: NoiseType, volume?: number, forceOn?: boolean) => {
    try { toggleNoiseInternal(type, false, volume, forceOn); } catch (e) { console.error(e); }
  }, [toggleNoiseInternal]);

  const syncToggleAmbient = useCallback((type: AmbientType, volume?: number, forceOn?: boolean) => {
    try { toggleAmbientInternal(type, false, volume, forceOn); } catch (e) { console.error(e); }
  }, [toggleAmbientInternal]);

  const syncVolumeChange = useCallback((key: string, volume: number) => {
    try { handleVolumeChangeInternal(key, volume, false); } catch (e) { console.error(e); }
  }, [handleVolumeChangeInternal]);

  const syncToggleFreq = useCallback(() => {
    try { toggleFrequencyInternal(false); } catch (e) { console.error(e); }
  }, [toggleFrequencyInternal]);

  const syncFreqChange = useCallback((f: number, forceOn?: boolean) => {
    try { handleFrequencyChangeInternal(f, false, forceOn); } catch (e) { console.error(e); }
  }, [handleFrequencyChangeInternal]);

  // --- EVENT HANDLERS ---
  const handleAtmosphereEvent = useCallback((data: any) => {
    const { action, soundType, key, volume, freq } = data;
    
    switch (action) {
      case 'set-state':
        if (data.sounds && Array.isArray(data.sounds)) {
          data.sounds.forEach((s: any) => {
            if (s.type === 'noise') syncToggleNoise(s.soundType, s.volume, true);
            else if (s.type === 'ambient') syncToggleAmbient(s.soundType, s.volume, true);
          });
        }
        if (typeof data.freqActive === 'boolean') {
          if (data.freqActive) syncFreqChange(data.frequency || 432, true);
          else if (freqActive) syncToggleFreq();
        }
        break;
      case 'toggle-noise':
        if (soundType) syncToggleNoise(soundType as NoiseType);
        break;
      case 'toggle-ambient':
        if (soundType) syncToggleAmbient(soundType as AmbientType);
        break;
      case 'volume-change':
        if (key && typeof volume === 'number') syncVolumeChange(key, volume);
        break;
      case 'toggle-freq':
        syncToggleFreq();
        break;
      case 'freq-change':
        if (typeof freq === 'number') syncFreqChange(freq);
        break;
    }
  }, [freqActive, syncToggleNoise, syncToggleAmbient, syncVolumeChange, syncToggleFreq, syncFreqChange]);

  const handleSyncRequestInternal = useCallback(() => {
    if (!realtimeManager) return;
    
    const presences = realtimeManager.getPresences().sort((a, b) => {
      const timeA = new Date(a.online_at).getTime();
      const timeB = new Date(b.online_at).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.connectionId.localeCompare(b.connectionId);
    });
    
    if (presences[0]?.connectionId !== realtimeManager.connectionId) return;

    const soundsPayload: any[] = [];
    activeSounds.forEach((val, key) => {
      const [type, sound] = key.split('-');
      soundsPayload.push({ type, soundType: sound, volume: val.volume });
    });

    realtimeManager.broadcastEvent({
      type: 'atmosphere-changed', userId, userName,
      data: { 
        action: 'set-state', 
        sounds: soundsPayload,
        freqActive,
        frequency
      },
      timestamp: Date.now()
    });
  }, [realtimeManager, userId, userName, activeSounds, freqActive, frequency]);

  // Sync atmosphere state across participants
  useEffect(() => {
    if (!realtimeManager) return;

    const handleAudioSyncEvent = (event: RoomEvent) => {
      if (!realtimeManager || event.connectionId === realtimeManager.connectionId) return;

      if (event.type === 'atmosphere-changed' && event.data) {
        if (event.data.action === 'sync-request') {
          handleSyncRequestInternal();
        } else {
          handleAtmosphereEvent(event.data);
        }
      }
    };

    realtimeManager.subscribeToEvents('audio-sync', handleAudioSyncEvent);

    // Joiner: Request sync with delay to allow channel to stabilize
    const timeoutId = globalThis.setTimeout(() => {
      realtimeManager.broadcastEvent({
        type: 'atmosphere-changed', userId, userName,
        data: { action: 'sync-request' },
        timestamp: Date.now()
      });
    }, 1000);

    return () => { 
      globalThis.clearTimeout(timeoutId);
      realtimeManager.unsubscribeFromEvents('audio-sync'); 
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeManager, userId, handleAtmosphereEvent, handleSyncRequestInternal]);

  // --- PUBLIC HANDLERS (for UI) ---
  const toggleNoise = (type: NoiseType) => toggleNoiseInternal(type, true);
  const toggleAmbient = (type: AmbientType) => toggleAmbientInternal(type, true);
  const handleVolumeChange = (key: string, vol: number) => handleVolumeChangeInternal(key, vol, true);
  const toggleFrequency = () => toggleFrequencyInternal(true);
  const handleFrequencyChange = (f: number) => handleFrequencyChangeInternal(f, true);


  return (
    <div className="ap-root">

      {/* ── Noise ── */}
      <div className="ap-section">
        <div className="ap-section-label">noise generators</div>
        <div className="ap-noise-list">
          {NOISE_TYPES.map(({ type, label, dot, desc }) => {
            const key = `noise-${type}`;
            const isActive = activeSounds.has(key);
            const sound = activeSounds.get(key);
            return (
              <div key={type} className="ap-noise-item">
                <button
                  onClick={() => toggleNoise(type)}
                  className={`ap-noise-btn ${isActive ? 'ap-noise-btn--active' : ''}`}
                  id={`noise-${type}-btn`}
                >
                  <span className="ap-noise-dot" style={{ background: dot }} />
                  <span className="ap-noise-label-wrap">
                    <span className="ap-noise-name">{label}</span>
                    <span className="ap-noise-desc">{desc}</span>
                  </span>
                  <span className="ap-noise-icon">
                    {isActive
                      ? <Volume2 size={14} />
                      : <VolumeX size={14} />}
                  </span>
                </button>
                {isActive && sound && (
                  <div className="ap-slider-wrap">
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={sound.volume}
                      onChange={e => handleVolumeChange(key, Number.parseFloat(e.target.value))}
                      className="ap-slider"
                    />
                    <span className="ap-slider-val">{Math.round(sound.volume * 100)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ap-divider" />

      {/* ── Frequency ── */}
      <div className="ap-section">
        <div className="ap-section-label">frequency tone</div>

        <button
          onClick={toggleFrequency}
          className={`ap-freq-btn ${freqActive ? 'ap-freq-btn--active' : ''}`}
          id="freq-toggle-btn"
        >
          <Radio size={15} />
          <span className="ap-freq-hz">{frequency} Hz</span>
          <span className="ap-noise-icon">
            {freqActive ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </span>
        </button>

        <div className="ap-slider-wrap" style={{ marginTop: '0.75rem' }}>
          <input
            type="range" min="20" max="2000" step="1"
            value={frequency}
            onChange={e => handleFrequencyChange(Number.parseInt(e.target.value, 10))}
            className="ap-slider"
          />
          <div className="ap-slider-range-labels">
            <span>20 Hz</span><span>2000 Hz</span>
          </div>
        </div>

        <div className="ap-presets">
          {FREQ_PRESETS.map(f => (
            <button
              key={f}
              onClick={() => handleFrequencyChange(f)}
              className={`ap-preset-pill ${frequency === f ? 'ap-preset-pill--active' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="ap-divider" />

      {/* ── Ambient ── */}
      <div className="ap-section">
        <div className="ap-section-label">ambient sounds</div>
        <div className="ap-ambient-grid">
          {AMBIENT_TYPES.map(({ type, label, emoji }) => {
            const key = `ambient-${type}`;
            const isActive = activeSounds.has(key);
            const sound = activeSounds.get(key);
            return (
              <div key={type}>
                <button
                  onClick={() => toggleAmbient(type)}
                  className={`ap-ambient-btn ${isActive ? 'ap-ambient-btn--active' : ''}`}
                  id={`ambient-${type}-btn`}
                >
                  <span className="ap-ambient-emoji">{emoji}</span>
                  <span className="ap-ambient-label">{label}</span>
                  {isActive && <span className="ap-ambient-active-dot" />}
                </button>
                {isActive && sound && (
                  <div className="ap-slider-wrap" style={{ marginTop: '0.4rem', padding: '0 0.25rem' }}>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={sound.volume}
                      onChange={e => handleVolumeChange(key, Number.parseFloat(e.target.value))}
                      className="ap-slider"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .ap-root {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* ── SECTION ── */
        .ap-section { padding: 0.25rem 0 0.5rem; }
        .ap-section-label {
          font-family: var(--font-sans);
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-text-muted);
          opacity: 0.7;
          margin-bottom: 0.85rem;
        }
        .ap-divider {
          height: 1px;
          background: var(--color-border);
          margin: 1rem 0;
          opacity: 0.6;
        }

        /* ── NOISE ── */
        .ap-noise-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .ap-noise-item { display: flex; flex-direction: column; gap: 0.35rem; }

        .ap-noise-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
          color: var(--color-text); 
        }
        .ap-noise-btn:hover {
          border-color: var(--color-primary);
          background: var(--color-surface);
        }
        .ap-noise-btn--active {
          background: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          color: var(--color-text-on-primary);
        }
        .ap-noise-btn--active .ap-noise-desc { color: rgba(255,255,255,0.65); }

        .ap-noise-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          border: 1px solid rgba(0,0,0,0.08);
        }
        .ap-noise-label-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.05rem;
          flex: 1;
        }
        .ap-noise-name {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.88rem;
          color: inherit;
        }
        .ap-noise-desc {
          font-family: var(--font-sans);
          font-size: 0.65rem;
          color: var(--color-text-muted);
          letter-spacing: 0.04em;
        }
        .ap-noise-icon {
          color: inherit;
          opacity: 0.7;
          display: flex;
          align-items: center;
        }

        /* ── SLIDERS ── */
        .ap-slider-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .ap-slider-val {
          font-family: var(--font-sans);
          font-size: 0.62rem;
          color: var(--color-text-muted);
          text-align: right;
        }
        .ap-slider-range-labels {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-sans);
          font-size: 0.6rem;
          color: var(--color-text-muted);
          opacity: 0.6;
        }

        .ap-slider {
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          height: 3px;
          border-radius: 2px;
          background: var(--color-border);
          outline: none;
          cursor: pointer;
        }
        .ap-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--color-primary);
          border: 2px solid var(--color-surface);
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .ap-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }

        /* ── FREQUENCY ── */
        .ap-freq-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: var(--color-text-muted);
        }
        .ap-freq-btn:hover {
          border-color: var(--color-primary);
          color: var(--color-text);
          background: var(--color-surface);
        }
        .ap-freq-btn--active {
          background: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
          color: var(--color-text-on-primary) !important;
        }
        .ap-freq-hz {
          font-family: var(--font-heading);
          font-style: italic;
          font-size: 0.9rem;
          flex: 1;
        }

        .ap-presets {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-top: 0.75rem;
        }
        .ap-preset-pill {
          font-family: var(--font-sans);
          font-size: 0.65rem;
          letter-spacing: 0.04em;
          padding: 0.3rem 0.7rem;
          border-radius: 100px;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .ap-preset-pill:hover { border-color: var(--color-primary); color: var(--color-text); }
        .ap-preset-pill--active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: var(--color-text-on-primary);
        }

        /* ── AMBIENT ── */
        .ap-ambient-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .ap-ambient-btn {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          padding: 0.9rem 0.5rem;
          background: var(--color-background);
          border: 1px solid var(--color-border);
          border-radius: 1.25rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .ap-ambient-btn:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px -5px var(--color-shadow);
        }
        .ap-ambient-btn--active {
          background: var(--color-surface) !important;
          border-color: var(--color-primary) !important;
          box-shadow: 0 4px 14px -4px rgba(148,168,154,0.3);
        }
        .ap-ambient-emoji { font-size: 1.3rem; line-height: 1; }
        .ap-ambient-label {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.78rem;
          color: var(--color-text-muted);
        }
        .ap-ambient-active-dot {
          position: absolute;
          top: 0.5rem;
          right: 0.6rem;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--color-primary);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}