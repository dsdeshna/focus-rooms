// COMMAND PATTERN IMPLEMENTED HERE
// Explanation: Each drawing action on the whiteboard is a Command
// object. When a user draws, we create a DrawCommand with the
// serialized canvas data and broadcast it to other users.
// The Command pattern decouples the drawing action from the
// execution — commands can be sent, received, and replayed.
// ============================================================

// === OBSERVER PATTERN USAGE ===
// The whiteboard subscribes as an observer to the RealtimeManager.
// When a remote user draws, the observer callback receives the
// draw command and applies it to the local canvas.

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeManager } from '@/lib/realtime/RealtimeManager';
import { WhiteboardRepository } from '@/lib/repositories/WhiteboardRepository';
import { RoomEvent } from '@/types';
import { Download, Trash2, Loader2, Minus, Plus } from 'lucide-react';
import { cryptoRandom } from '@/lib/utils';

interface WhiteboardProps {
  roomCode: string;
  userId: string;
  roomId: string;
  realtimeManager: RealtimeManager | null;
}

const COLOR_PRESETS = [
  { hex: '#4A4543', label: 'Ink' },
  { hex: '#94A89A', label: 'Sage' },
  { hex: '#D89898', label: 'Blush' },
  { hex: '#C0A080', label: 'Tan' },
  { hex: '#8EC4CC', label: 'Mist' },
  { hex: '#C4A8D4', label: 'Lavender' },
  { hex: '#E8C85A', label: 'Honey' },
  { hex: '#FFFFFF', label: 'White' },
];

const CANVAS_BACKGROUND = '#FDFBF7';
const WHITEBOARD_WIDTH = 1920;
const WHITEBOARD_HEIGHT = 1080;

type CanvasPoint = { x: number; y: number };

export function Whiteboard({ roomCode, userId, roomId, realtimeManager }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#4A4543');
  const [brushSize, setBrushSize] = useState(3);
  const [saving, setSaving] = useState(false);
  const [eraser, setEraser] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastBroadcastRef = useRef<number>(0);
  const lastBroadcastPointRef = useRef<{ x: number; y: number } | null>(null);
  const pendingSyncRequestsRef = useRef<Set<string>>(new Set());
  const whiteboardRepo = new WhiteboardRepository();
  const isCustomColor = !COLOR_PRESETS.some(({ hex }) => hex.toLowerCase() === color.toLowerCase());

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = CANVAS_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawSegment = useCallback((from: CanvasPoint, to: CanvasPoint, strokeColor: string, strokeSize: number) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.moveTo(from.x * canvas.width, from.y * canvas.height);
    ctx.lineTo(to.x * canvas.width, to.y * canvas.height);
    ctx.stroke();
  }, []);

  const applySnapshot = useCallback((image: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = image;
  }, []);

  const broadcastSnapshot = useCallback((requestId: string, targetConnectionId: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !realtimeManager) return;

    try {
      const image = canvas.toDataURL('image/webp', 0.55);
      realtimeManager.broadcastEvent({
        type: 'whiteboard-draw',
        userId,
        userName: '',
        data: {
          action: 'full-sync',
          requestId,
          targetConnectionId,
          image,
        },
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error('Failed to create whiteboard sync snapshot:', err);
    }
  }, [realtimeManager, userId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = WHITEBOARD_WIDTH;
    canvas.height = WHITEBOARD_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = CANVAS_BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
  }, []);

  const handleRemoteDraw = useCallback((data: any) => {
    if (data.from && data.to) {
      drawSegment(
        data.from as CanvasPoint,
        data.to as CanvasPoint,
        data.color as string,
        data.brushSize as number
      );
    }
  }, [drawSegment]);

  const handleRemoteSyncRequest = useCallback((data: any) => {
    const requestId = data.requestId as string | undefined;
    const requesterConnectionId = data.requesterConnectionId as string | undefined;
    if (!requestId || !requesterConnectionId || !realtimeManager) return;

    // === HARDENED LEADER ELECTION ===
    const presences = realtimeManager.getPresences().sort((a, b) => {
      const timeA = new Date(a.online_at).getTime();
      const timeB = new Date(b.online_at).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return a.connectionId.localeCompare(b.connectionId);
    });
    
    const isLeader = presences[0]?.connectionId === realtimeManager.connectionId;
    if (!isLeader) return;

    globalThis.setTimeout(() => {
      broadcastSnapshot(requestId, requesterConnectionId);
    }, cryptoRandom() * 200 + 50);
  }, [realtimeManager, broadcastSnapshot]);

  const handleRemoteFullSync = useCallback((data: any) => {
    if (!realtimeManager) return;
    const targetConnectionId = data.targetConnectionId as string | undefined;
    if (targetConnectionId && targetConnectionId !== realtimeManager.connectionId) return;

    const requestId = data.requestId as string | undefined;
    if (requestId) {
      if (!pendingSyncRequestsRef.current.has(requestId)) return;
      pendingSyncRequestsRef.current.delete(requestId);
    }

    if (data.image) {
      try {
        applySnapshot(data.image as string);
      } catch (err) {
        console.error('Failed to apply full sync:', err);
      }
    }
  }, [realtimeManager, applySnapshot]);

  useEffect(() => {
    if (!realtimeManager) return;
    const handleWhiteboardEvent = (event: RoomEvent) => {
      if (event.type !== 'whiteboard-draw' || !realtimeManager) return;
      if (event.connectionId === realtimeManager.connectionId) return;
      
      const data = event.data;
      if (!data || !ctxRef.current) return;

      switch (data.action) {
        case 'draw':
          handleRemoteDraw(data);
          break;
        case 'clear':
          clearCanvas();
          break;
        case 'sync-request':
          handleRemoteSyncRequest(data);
          break;
        case 'full-sync':
          handleRemoteFullSync(data);
          break;
      }
    };

    realtimeManager.subscribeToEvents('whiteboard', handleWhiteboardEvent);

    // Automatically request sync when arriving
    const requestId = `${realtimeManager.connectionId}-${Date.now()}`;
    const pendingSyncRequests = pendingSyncRequestsRef.current;
    pendingSyncRequests.add(requestId);
    const timeoutId = globalThis.setTimeout(() => {
      realtimeManager.broadcastEvent({
        type: 'whiteboard-draw', userId, userName: '',
        data: {
          action: 'sync-request',
          requestId,
          requesterConnectionId: realtimeManager.connectionId,
        },
        timestamp: Date.now()
      });
    }, 1500);

    return () => {
      globalThis.clearTimeout(timeoutId);
      pendingSyncRequests.delete(requestId);
      realtimeManager.unsubscribeFromEvents('whiteboard');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applySnapshot, broadcastSnapshot, clearCanvas, drawSegment, realtimeManager, userId, handleRemoteDraw, handleRemoteSyncRequest, handleRemoteFullSync]);


  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    
    let cx = 0; let cy = 0;
    if ('touches' in e && e.touches.length > 0) {
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    } else if ('clientX' in e) {
      cx = (e as React.MouseEvent).clientX;
      cy = (e as React.MouseEvent).clientY;
    }
    return {
      x: (cx - rect.left) * (canvas.width / rect.width),
      y: (cy - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    lastPointRef.current = point;
    lastBroadcastPointRef.current = point;
    setIsDrawing(true);
  };

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current || !lastPointRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    const point  = getCanvasPoint(e);
    const from   = lastPointRef.current;
    const activeColor = eraser ? CANVAS_BACKGROUND : color;
    const activeSize  = eraser ? brushSize * 4 : brushSize;

    ctx.beginPath();
    ctx.strokeStyle = activeColor;
    ctx.lineWidth   = activeSize;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    const now = Date.now();
    // Throttle to ~16ms (60fps)
    if (realtimeManager && (now - lastBroadcastRef.current > 16)) {
      const bFrom = lastBroadcastPointRef.current || from;
      
      // Send normalized coordinates (0-1)
      realtimeManager.broadcastEvent({
        type: 'whiteboard-draw', userId, userName: '',
        data: { 
          action: 'draw', 
          from: { x: bFrom.x / canvas.width, y: bFrom.y / canvas.height }, 
          to: { x: point.x / canvas.width, y: point.y / canvas.height }, 
          color: activeColor, 
          brushSize: activeSize 
        },
        timestamp: now,
      });
      lastBroadcastPointRef.current = point;
      lastBroadcastRef.current = now;
    }
    lastPointRef.current = point;
  }, [isDrawing, color, brushSize, eraser, getCanvasPoint, realtimeManager, userId]);

  const stopDrawing = () => {
    // Send final segment if needed
    if (isDrawing && lastBroadcastPointRef.current && lastPointRef.current && canvasRef.current && realtimeManager) {
      const canvas = canvasRef.current;
      const bFrom = lastBroadcastPointRef.current;
      const point = lastPointRef.current;
      const activeColor = eraser ? CANVAS_BACKGROUND : color;
      const activeSize  = eraser ? brushSize * 4 : brushSize;

      if (bFrom.x !== point.x || bFrom.y !== point.y) {
        realtimeManager.broadcastEvent({
          type: 'whiteboard-draw', userId, userName: '',
          data: { 
            action: 'draw', 
            from: { x: bFrom.x / canvas.width, y: bFrom.y / canvas.height }, 
            to: { x: point.x / canvas.width, y: point.y / canvas.height }, 
            color: activeColor, 
            brushSize: activeSize 
          },
          timestamp: Date.now(),
        });
      }
    }
    setIsDrawing(false); 
    lastPointRef.current = null; 
    lastBroadcastPointRef.current = null;
  };

  const clearWhiteboard = () => {
    clearCanvas();
    if (realtimeManager) {
      realtimeManager.broadcastEvent({ type: 'whiteboard-draw', userId, userName: '', data: { action: 'clear' }, timestamp: Date.now() });
    }
  };

  const saveWhiteboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await whiteboardRepo.saveSnapshot(roomId, userId, dataUrl);
      const link = document.createElement('a');
      link.download = `whiteboard-${roomCode}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) { 
      console.error('Failed to save whiteboard:', err); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="wb-root">
      {/* ── Toolbar ── */}
      <div className="wb-toolbar">

        {/* Colors */}
        <div className="wb-colors">
          {COLOR_PRESETS.map(({ hex, label }) => (
            <button
              key={hex}
              className={`wb-color-swatch ${color === hex && !eraser ? 'wb-color-swatch--active' : ''}`}
              style={{ background: hex }}
              onClick={() => { setColor(hex); setEraser(false); }}
              title={label}
              aria-label={label}
            />
          ))}
          <label
            className={`wb-custom-color ${isCustomColor && !eraser ? 'wb-custom-color--active' : ''}`}
            title="Custom colour"
            aria-label="Choose custom pen colour"
          >
            <span className="wb-custom-color-preview" style={{ background: color }}>
              <span className="wb-custom-color-plus">+</span>
            </span>
            <input
              type="color"
              value={color}
              onChange={e => { setColor(e.target.value); setEraser(false); }}
              className="wb-color-picker"
              id="whiteboard-color-picker"
            />
          </label>
        </div>

        <div className="wb-toolbar-sep" />

        {/* Brush size */}
        <div className="wb-brush-row">
          <button className="wb-brush-btn" onClick={() => setBrushSize(s => Math.max(1, s - 1))}>
            <Minus size={10} />
          </button>
          <div className="wb-brush-preview">
            <div className="wb-brush-dot" style={{ width: Math.min(brushSize * 3, 22), height: Math.min(brushSize * 3, 22), background: eraser ? 'var(--color-border)' : color }} />
          </div>
          <button className="wb-brush-btn" onClick={() => setBrushSize(s => Math.min(30, s + 1))}>
            <Plus size={10} />
          </button>
          <span className="wb-brush-val">{brushSize}px</span>
        </div>

        <div className="wb-toolbar-sep" />

        {/* Eraser */}
        <button
          className={`wb-tool-btn ${eraser ? 'wb-tool-btn--active' : ''}`}
          onClick={() => setEraser(v => !v)}
          title="Eraser"
        >
          eraser
        </button>

        {/* Actions */}
        <div className="wb-actions">
          <button onClick={saveWhiteboard} className="wb-action-btn" disabled={saving} id="whiteboard-save">
            {saving ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
            save
          </button>
          <button onClick={clearWhiteboard} className="wb-action-btn wb-action-btn--danger" id="whiteboard-clear">
            <Trash2 size={13} />
            clear
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="wb-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={WHITEBOARD_WIDTH}
          height={WHITEBOARD_HEIGHT}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
          className="wb-canvas"
          style={{ cursor: eraser ? 'cell' : 'crosshair', touchAction: 'none' }}
          id="whiteboard-canvas"
        />
      </div>

      <style>{`
        .wb-root {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0 8px 30px -10px var(--color-shadow-lg);
          animation: fadeIn 0.4s ease both;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        /* ── TOOLBAR ── */
        .wb-toolbar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-background);
          flex-wrap: wrap;
        }
        .wb-toolbar-sep {
          width: 1px;
          height: 1.5rem;
          background: var(--color-border);
          flex-shrink: 0;
        }

        /* Colors */
        .wb-colors {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .wb-color-swatch {
          width: 18px; height: 18px;
          border-radius: 50%;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          flex-shrink: 0;
          outline: none;
        }
        .wb-color-swatch:hover { transform: scale(1.2); }
        .wb-color-swatch--active {
          border-color: var(--color-text);
          transform: scale(1.25);
          box-shadow: 0 0 0 2px var(--color-background);
        }
        .wb-custom-color {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          height: 1.8rem;
          padding: 0.25rem 0.55rem 0.25rem 0.35rem;
          border-radius: 100px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-muted);
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
          flex-shrink: 0;
        }
        .wb-custom-color:hover,
        .wb-custom-color--active {
          border-color: var(--color-text);
          color: var(--color-text);
          background: var(--color-background);
        }
        .wb-custom-color-preview {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          border: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .wb-custom-color-preview {
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          border: 1px solid var(--color-border);
          flex-shrink: 0;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wb-custom-color-plus {
          font-size: 0.7rem;
          font-weight: 600;
          color: white;
          mix-blend-mode: difference;
          pointer-events: none;
        }
        .wb-color-picker {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          cursor: pointer;
          opacity: 0;
        }

        /* Brush */
        .wb-brush-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .wb-brush-btn {
          width: 1.4rem; height: 1.4rem;
          display: flex; align-items: center; justify-content: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 50%;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all 0.2s;
        }
        .wb-brush-btn:hover { background: var(--color-background); color: var(--color-text); }
        .wb-brush-preview {
          width: 2rem; height: 2rem;
          display: flex; align-items: center; justify-content: center;
        }
        .wb-brush-dot {
          border-radius: 50%;
          transition: all 0.2s;
          border: 1px solid var(--color-border);
          flex-shrink: 0;
        }
        .wb-brush-val {
          font-family: var(--font-sans);
          font-size: 0.62rem;
          color: var(--color-text-muted);
          width: 2rem;
          letter-spacing: 0.02em;
        }

        /* Tool btn */
        .wb-tool-btn {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.78rem;
          color: var(--color-text-muted);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          padding: 0.3rem 0.8rem;
          cursor: pointer;
          transition: all 0.25s;
        }
        .wb-tool-btn:hover { border-color: var(--color-text); color: var(--color-text); }
        .wb-tool-btn--active {
          background: var(--color-text);
          color: var(--color-background);
          border-color: var(--color-text);
        }

        /* Actions */
        .wb-actions { display: flex; gap: 0.4rem; margin-left: auto; }
        .wb-action-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.85rem;
          font-family: var(--font-body);
          font-style: italic;
          font-size: 0.8rem;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all 0.25s;
        }
        .wb-action-btn:hover:not(:disabled) {
          border-color: var(--color-text);
          color: var(--color-text);
          background: var(--color-background);
        }
        .wb-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .wb-action-btn--danger:hover:not(:disabled) {
          border-color: var(--color-danger-border);
          color: var(--color-danger);
          background: var(--color-danger-bg);
        }

        /* ── CANVAS ── */
        .wb-canvas-wrap {
          overflow: auto;
          background: #FDFBF7;
          max-height: calc(100vh - 13rem);
        }
        .wb-canvas {
          display: block;
          width: 1920px;
          height: 1080px;
          max-width: none;
          max-height: none;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
