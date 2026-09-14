import React, { useState, useRef, useCallback } from 'react';

export default function ImageCompareSlider({ originalSrc, overlaySrc }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const updateSlider = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handlePointerDown = useCallback((e) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateSlider(e.clientX);
  }, [updateSlider]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    updateSlider(e.clientX);
  }, [updateSlider]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  if (!originalSrc || !overlaySrc) {
    return (
      <div className="surface-card" style={{
        padding: 'var(--space-6)',
        textAlign: 'center',
        color: 'var(--text-3)',
        fontSize: 13,
      }}>
        Upload and run inference to compare original with anomaly heatmap.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-3)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        <span>Original</span>
        <span>Heatmap Overlay</span>
      </div>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          cursor: 'col-resize',
          border: '1px solid var(--border-subtle)',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* Overlay (right side - visible from slider to right) */}
        <img
          src={overlaySrc}
          alt="Anomaly heatmap overlay"
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Original (left side - clipped to slider position) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          width: `${sliderPos}%`,
          overflow: 'hidden',
        }}>
          <img
            src={originalSrc}
            alt="Original component image"
            draggable={false}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${100 / (sliderPos / 100)}%`,
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>

        {/* Divider line */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPos}%`,
          width: 2,
          background: 'var(--accent-primary)',
          transform: 'translateX(-50%)',
          zIndex: 2,
        }}>
          {/* Handle */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--surface-1)',
            border: '2px solid var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M4 3L1 7L4 11" stroke="var(--accent-primary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 3L13 7L10 11" stroke="var(--accent-primary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
